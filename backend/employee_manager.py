from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import PayrollSummary
from .tables import Employee, Shift


class EmployeeManager:
    def __init__(self, session: Session) -> None:
        self.session = session

    def start_shift(self, employee_id: int) -> Shift:
        existing_shift = (
            self.session.execute(
                select(Shift).where(
                    Shift.employee_id == employee_id, Shift.clock_out.is_(None)
                )
            )
            .scalars()
            .first()
        )
        if existing_shift:
            return existing_shift

        shift = Shift(employee_id=employee_id, clock_in=datetime.utcnow())
        self.session.add(shift)
        self.session.flush()
        return shift

    def end_shift(self, employee_id: int) -> Shift:
        shift = (
            self.session.execute(
                select(Shift).where(
                    Shift.employee_id == employee_id, Shift.clock_out.is_(None)
                )
            )
            .scalars()
            .first()
        )
        if not shift:
            raise ValueError("진행 중인 근무가 없습니다.")
        shift.clock_out = datetime.utcnow()
        self.session.flush()
        return shift

    def payroll_summary(self) -> List[PayrollSummary]:
        stmt = (
            select(
                Employee.id,
                Employee.name,
                func.sum(
                    func.coalesce(
                        func.extract("epoch", Shift.clock_out) - func.extract("epoch", Shift.clock_in),
                        0,
                    )
                ),
                Employee.hourly_wage,
            )
            .join(Shift, Shift.employee_id == Employee.id)
            .where(Shift.clock_out.is_not(None))
            .group_by(Employee.id, Employee.name, Employee.hourly_wage)
        )

        summaries: List[PayrollSummary] = []
        for employee_id, name, seconds, hourly_wage in self.session.execute(stmt):
            total_hours = float(seconds or 0) / 3600
            total_pay = (Decimal(hourly_wage) * Decimal(total_hours)).quantize(Decimal("0.01"))
            summaries.append(
                PayrollSummary(
                    employee_id=employee_id,
                    employee_name=name,
                    total_hours=round(total_hours, 2),
                    total_pay=total_pay,
                )
            )
        return summaries

