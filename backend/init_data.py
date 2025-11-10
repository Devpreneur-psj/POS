from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import DATA_DIR
from .tables import Employee, Inventory, MenuItem, Table

INIT_FILE = DATA_DIR / "init.json"


def _as_decimal(value: Any) -> Decimal:
    if isinstance(value, (int, float, str)):
        return Decimal(str(value))
    if isinstance(value, Decimal):
        return value
    raise ValueError(f"Cannot convert to Decimal: {value}")


def load_initial_data(session: Session) -> None:
    if not INIT_FILE.exists():
        raise FileNotFoundError(f"초기 데이터 파일을 찾을 수 없습니다: {INIT_FILE}")

    with INIT_FILE.open("r", encoding="utf-8") as f:
        payload: Dict[str, Any] = json.load(f)

    _load_menu(session, payload.get("menu", []))
    _load_inventory(session, payload.get("inventory", []))
    _load_tables(session, payload.get("store", {}).get("tables", []))
    _load_employees(session, payload.get("employees", []))
    session.commit()


def _load_menu(session: Session, menu_items: Iterable[Dict[str, Any]]) -> None:
    existing_names = {
        name for (name,) in session.execute(select(MenuItem.name)).all()
    }
    for item in menu_items:
        if item["name"] in existing_names:
            continue
        session.add(
            MenuItem(
                name=item["name"],
                category=item["category"],
                base_price=_as_decimal(item["base_price"]),
                description=item.get("description"),
                is_active=item.get("is_active", True),
            )
        )


def _load_inventory(session: Session, inventory_items: Iterable[Dict[str, Any]]) -> None:
    existing_names = {
        name for (name,) in session.execute(select(Inventory.name)).all()
    }
    menu_map = {
        name: menu_id
        for (menu_id, name) in session.execute(select(MenuItem.id, MenuItem.name)).all()
    }
    for item in inventory_items:
        if item["name"] in existing_names:
            continue
        session.add(
            Inventory(
                name=item["name"],
                unit=item.get("unit"),
                quantity=float(item.get("quantity", 0)),
                threshold=float(item.get("threshold", 0)),
                menu_item_id=menu_map.get(item["name"]),
            )
        )


def _load_tables(session: Session, tables: Iterable[Dict[str, Any]]) -> None:
    existing_names = {
        name for (name,) in session.execute(select(Table.name)).all()
    }
    for item in tables:
        if item["name"] in existing_names:
            continue
        session.add(
            Table(
                name=item["name"],
                capacity=item.get("capacity", 2),
            )
        )


def _load_employees(session: Session, employees: Iterable[Dict[str, Any]]) -> None:
    existing_names = {
        name for (name,) in session.execute(select(Employee.name)).all()
    }
    for item in employees:
        if item["name"] in existing_names:
            continue
        session.add(
            Employee(
                name=item["name"],
                role=item["role"],
                hourly_wage=_as_decimal(item.get("hourly_wage", 0)),
                is_active=item.get("is_active", True),
            )
        )

