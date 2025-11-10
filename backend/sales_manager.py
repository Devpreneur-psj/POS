from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, Iterable, List, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import SalesDashboardResponse, SalesSummary, SalesTrendPoint
from .tables import CustomerFeedback, MenuItem, Order, OrderItem


class SalesManager:
    def __init__(self, session: Session) -> None:
        self.session = session

    def summarize(self, period: str = "DAILY") -> SalesDashboardResponse:
        period = period.upper()
        summary = self._build_summary(period)
        return SalesDashboardResponse(
            summary=summary,
            daily=self._trend("day", 14),
            weekly=self._trend("week", 12),
            monthly=self._trend("month", 12),
            yearly=self._trend("year", 5),
        )

    def _build_summary(self, period: str) -> SalesSummary:
        start_date = self._period_start(period)
        stmt = (
            select(
                func.sum(Order.total_amount),
                func.count(Order.id),
                func.avg(CustomerFeedback.rating),
            )
            .outerjoin(CustomerFeedback, CustomerFeedback.order_id == Order.id)
            .where(Order.created_at >= start_date)
        )

        total_sales, order_count, avg_rating = self.session.execute(stmt).one()
        total_sales = total_sales or Decimal("0")
        order_count = order_count or 0
        avg_order_value = (total_sales / order_count) if order_count else Decimal("0")

        top_items = self._top_menu_items(start_date)

        return SalesSummary(
            total_revenue=Decimal(total_sales),
            total_orders=order_count,
            average_order_value=Decimal(avg_order_value),
            average_rating=float(avg_rating) if avg_rating is not None else None,
            period=period,
            top_menu_items=top_items,
        )

    def _top_menu_items(self, start_date: datetime) -> List[Dict[str, str]]:
        stmt = (
            select(
                MenuItem.name,
                func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
            )
            .join(OrderItem.menu_item)
            .join(OrderItem.order)
            .where(Order.created_at >= start_date)
            .group_by(MenuItem.name)
            .order_by(func.sum(OrderItem.quantity * OrderItem.unit_price).desc())
            .limit(5)
        )
        return [
            {"name": name, "revenue": str(revenue)} for name, revenue in self.session.execute(stmt)
        ]

    def _trend(self, granularity: str, points: int) -> List[SalesTrendPoint]:
        buckets: Dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
        orders = self.session.execute(select(Order)).scalars().all()

        for order in orders:
            label = self._bucket_label(order.created_at, granularity)
            buckets[label] += Decimal(order.total_amount or 0)

        sorted_points: List[Tuple[str, Decimal]] = sorted(
            buckets.items(),
            key=lambda kv: kv[0],
        )
        return [
            SalesTrendPoint(label=label, value=value)
            for label, value in sorted_points[-points:]
        ]

    def _period_start(self, period: str) -> datetime:
        now = datetime.utcnow()
        if period == "WEEKLY":
            start = now - timedelta(days=7)
        elif period == "MONTHLY":
            start = now - timedelta(days=30)
        elif period == "YEARLY":
            start = now - timedelta(days=365)
        else:
            start = datetime.combine(date.today(), datetime.min.time())
        return start

    def _bucket_label(self, dt: datetime, granularity: str) -> str:
        if granularity == "week":
            year, week_no, _ = dt.isocalendar()
            return f"{year}-W{week_no:02d}"
        if granularity == "month":
            return dt.strftime("%Y-%m")
        if granularity == "year":
            return dt.strftime("%Y")
        return dt.strftime("%Y-%m-%d")

