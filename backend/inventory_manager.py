from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from .tables import Inventory, InventoryAlert, MenuItem


@dataclass
class InventoryAdjustment:
    name: str
    quantity: float


class InventoryManager:
    def __init__(self, session: Session) -> None:
        self.session = session

    def deduct(self, adjustments: Iterable[InventoryAdjustment]) -> List[InventoryAlert]:
        alerts: List[InventoryAlert] = []
        for adjustment in adjustments:
            inventory = self._get_inventory_for_menu(adjustment.name)
            if not inventory:
                continue
            inventory.quantity = max(inventory.quantity - adjustment.quantity, 0)
            if inventory.quantity <= inventory.threshold:
                alerts.append(
                    self._create_alert(
                        inventory,
                        f"{inventory.name} 재고가 임계값 이하입니다. (잔량: {inventory.quantity:.1f}{inventory.unit or ''})",
                    )
                )
        self.session.flush()
        return alerts

    def _get_inventory_for_menu(self, menu_name: str) -> Optional[Inventory]:
        stmt = (
            select(Inventory)
            .join(MenuItem, isouter=True)
            .where(Inventory.name == menu_name)
        )
        inventory: Optional[Inventory] = self.session.execute(stmt).scalars().first()
        return inventory

    def _create_alert(self, inventory: Inventory, message: str) -> InventoryAlert:
        alert = InventoryAlert(
            inventory=inventory,
            triggered_at=datetime.utcnow(),
            message=message,
        )
        self.session.add(alert)
        return alert

    def resolve_alert(self, inventory_id: int) -> None:
        alert_stmt = (
            select(InventoryAlert)
            .where(
                InventoryAlert.inventory_id == inventory_id,
                InventoryAlert.resolved_at.is_(None),
            )
            .order_by(InventoryAlert.triggered_at.desc())
        )
        alert = self.session.execute(alert_stmt).scalars().first()
        if alert:
            alert.resolved_at = datetime.utcnow()
            self.session.flush()

