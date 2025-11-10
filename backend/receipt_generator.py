from __future__ import annotations

from decimal import Decimal
from typing import List

from .models import Receipt, ReceiptLine
from .tables import Order, OrderItem


def generate_receipt(order: Order, store_name: str) -> Receipt:
    if not order.payment:
        raise ValueError("결제 정보가 없는 주문입니다.")

    lines: List[ReceiptLine] = []
    for item in order.items:
        if not isinstance(item, OrderItem):
            continue
        name = item.menu_item.name if item.menu_item else f"메뉴 #{item.menu_item_id}"
        unit_price = Decimal(item.unit_price)
        quantity = item.quantity
        lines.append(
            ReceiptLine(
                name=name,
                quantity=quantity,
                unit_price=unit_price,
                line_total=unit_price * quantity,
            )
        )

    return Receipt(
        store_name=store_name,
        table_name=f"{order.table.name}" if order.table else f"테이블 #{order.table_id}",
        items=lines,
        total_amount=Decimal(order.total_amount),
        payment_method=order.payment.method,
        paid_amount=Decimal(order.payment.amount_paid),
        change_amount=Decimal(order.payment.change_amount),
        thank_you_message="감사합니다. 또 방문해주세요!",
    )

