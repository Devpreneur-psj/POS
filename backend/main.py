from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, session_scope
from .employee_manager import EmployeeManager
from .init_data import load_initial_data
from .inventory_manager import InventoryAdjustment, InventoryManager
from .models import (
    ClockEvent,
    ClockResponse,
    EmployeeCreate,
    EmployeeOut,
    InventoryOut,
    InventoryUpdate,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    OrderCreate,
    OrderOut,
    OrderUpdate,
    PayrollSummary,
    Receipt,
    SalesDashboardResponse,
)
from .receipt_generator import generate_receipt
from .sales_manager import SalesManager
from .tables import (
    Employee,
    Inventory,
    InventoryAlert,
    MenuItem,
    Order,
    OrderItem,
    Payment,
    Table,
    CustomerFeedback,
)

STORE_NAME = "소확행 (So-Whak-Haeng)"
RECIPE_MAP: Dict[str, Dict[str, float]] = {
    "엑스밤": {"엑스레이티드": 45, "토닉워터": 120, "라임": 0.5},
    "말리부오렌지": {"말리부": 45, "오렌지주스": 150},
    "잭콕": {"잭다니엘": 60, "콜라": 150},
    "깔루아밀크": {"깔루아": 45, "우유": 180},
    "깔루아": {"깔루아": 45},
    "엑스레이티드": {"엑스레이티드": 45},
    "말리부": {"말리부": 45},
    "잭다니엘": {"잭다니엘": 45},
    "토닉워터": {"토닉워터": 250},
    "오렌지주스": {"오렌지주스": 250},
    "콜라": {"콜라": 250},
    "사이다": {"사이다": 250},
    "우유": {"우유": 250},
}


class InventoryUpdateRequest(BaseModel):
    inventory_id: int
    quantity: Optional[float] = None
    threshold: Optional[float] = None


class OrderStatusResponse(BaseModel):
    id: int
    status: str


class CreateEmployeeRequest(EmployeeCreate):
    pass


def create_app() -> FastAPI:
    app = FastAPI(
        title="소확행 POS API",
        description="소확행 POS & Store Simulator 백엔드",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            load_initial_data(session)

    @app.get("/health")
    def health_check() -> Dict[str, str]:
        return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

    # ------------------ Menu ------------------ #
    @app.get("/menu", response_model=List[MenuItemOut])
    def list_menu(db: Session = Depends(get_db)) -> List[MenuItem]:
        items = db.execute(select(MenuItem).order_by(MenuItem.category, MenuItem.name)).scalars().all()
        return items

    @app.post("/menu", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
    def add_menu_item(payload: MenuItemCreate, db: Session = Depends(get_db)) -> MenuItem:
        item = MenuItem(**payload.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @app.put("/menu/{menu_id}", response_model=MenuItemOut)
    def update_menu_item(menu_id: int, payload: MenuItemUpdate, db: Session = Depends(get_db)) -> MenuItem:
        item = db.get(MenuItem, menu_id)
        if not item:
            raise HTTPException(status_code=404, detail="메뉴를 찾을 수 없습니다.")
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    @app.delete("/menu/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_menu_item(menu_id: int, db: Session = Depends(get_db)) -> None:
        item = db.get(MenuItem, menu_id)
        if not item:
            raise HTTPException(status_code=404, detail="메뉴를 찾을 수 없습니다.")
        db.delete(item)
        db.commit()

    # ------------------ Inventory ------------------ #
    @app.get("/inventory", response_model=List[InventoryOut])
    def list_inventory(db: Session = Depends(get_db)) -> List[Inventory]:
        inventory = db.execute(select(Inventory).order_by(Inventory.name)).scalars().all()
        return inventory

    @app.put("/inventory/update", response_model=InventoryOut)
    def update_inventory(payload: InventoryUpdateRequest, db: Session = Depends(get_db)) -> Inventory:
        inventory = db.get(Inventory, payload.inventory_id)
        if not inventory:
            raise HTTPException(status_code=404, detail="재고를 찾을 수 없습니다.")
        if payload.quantity is not None:
            inventory.quantity = payload.quantity
            if inventory.quantity > inventory.threshold:
                InventoryManager(db).resolve_alert(inventory.id)
        if payload.threshold is not None:
            inventory.threshold = payload.threshold
        db.commit()
        db.refresh(inventory)
        return inventory

    @app.get("/inventory/alerts", response_model=List[Dict[str, str]])
    def list_inventory_alerts(db: Session = Depends(get_db)) -> List[Dict[str, str]]:
        alerts = (
            db.execute(
                select(InventoryAlert).where(InventoryAlert.resolved_at.is_(None)).order_by(InventoryAlert.triggered_at.desc())
            )
            .scalars()
            .all()
        )
        return [
            {
                "id": alert.id,
                "inventory_id": alert.inventory_id,
                "message": alert.message,
                "triggered_at": alert.triggered_at.isoformat(),
            }
            for alert in alerts
        ]

    # ------------------ Orders ------------------ #
    @app.get("/orders", response_model=List[OrderOut])
    def list_orders(db: Session = Depends(get_db)) -> List[Order]:
        orders = (
            db.execute(select(Order).order_by(Order.created_at.desc()))
            .scalars()
            .all()
        )
        return orders

    @app.post("/order", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
    def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
        table = db.get(Table, payload.table_id)
        if not table:
            raise HTTPException(status_code=404, detail="테이블을 찾을 수 없습니다.")

        order = Order(
            table_id=payload.table_id,
            status=payload.status,
            payment_method=payload.payment_method,
            paid_amount=payload.paid_amount,
            change_amount=payload.change_amount,
        )
        db.add(order)

        total_amount = Decimal("0")
        recipe_accumulator: Dict[str, float] = defaultdict(float)

        for item in payload.items:
            menu_item = db.get(MenuItem, item.menu_item_id)
            if not menu_item:
                raise HTTPException(status_code=404, detail=f"메뉴 {item.menu_item_id}를 찾을 수 없습니다.")
            order_item = OrderItem(
                order=order,
                menu_item_id=menu_item.id,
                quantity=item.quantity,
                unit_price=menu_item.base_price,
            )
            db.add(order_item)
            total_amount += Decimal(menu_item.base_price) * item.quantity

            recipe = RECIPE_MAP.get(menu_item.name, {})
            for name, amount in recipe.items():
                recipe_accumulator[name] += amount * item.quantity

        order.total_amount = total_amount

        if payload.payment_method and payload.paid_amount is not None:
            change_amount = Decimal(payload.paid_amount) - total_amount
            order.change_amount = max(change_amount, Decimal("0"))
            payment = Payment(
                order=order,
                method=payload.payment_method,
                amount_due=total_amount,
                amount_paid=payload.paid_amount,
                change_amount=order.change_amount,
            )
            db.add(payment)

        inventory_manager = InventoryManager(db)
        adjustments = [
            InventoryAdjustment(name=name, quantity=quantity) for name, quantity in recipe_accumulator.items()
        ]
        alerts = inventory_manager.deduct(adjustments)

        if payload.rating:
            feedback = CustomerFeedback(
                order=order,
                rating=payload.rating,
                comment=payload.comment,
            )
            db.add(feedback)

        db.commit()
        db.refresh(order)

        response = OrderOut.from_orm(order)
        if alerts:
            headers = {"X-Inventory-Alerts": ",".join(str(alert.id) for alert in alerts)}
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content=jsonable_encoder(response),
                headers=headers,
            )
        return response

    @app.put("/order/{order_id}", response_model=OrderOut)
    def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)) -> Order:
        order = db.get(Order, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")

        if payload.items is not None:
            db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
            total_amount = Decimal("0")
            recipe_accumulator: Dict[str, float] = defaultdict(float)
            for item in payload.items:
                menu_item = db.get(MenuItem, item.menu_item_id)
                if not menu_item:
                    raise HTTPException(status_code=404, detail=f"메뉴 {item.menu_item_id}를 찾을 수 없습니다.")
                db.add(
                    OrderItem(
                        order=order,
                        menu_item_id=menu_item.id,
                        quantity=item.quantity,
                        unit_price=menu_item.base_price,
                    )
                )
                total_amount += Decimal(menu_item.base_price) * item.quantity
                recipe = RECIPE_MAP.get(menu_item.name, {})
                for name, amount in recipe.items():
                    recipe_accumulator[name] += amount * item.quantity
            order.total_amount = total_amount
            InventoryManager(db).deduct(
                [
                    InventoryAdjustment(name=name, quantity=quantity)
                    for name, quantity in recipe_accumulator.items()
                ]
            )

        for key, value in payload.dict(exclude={"items"}, exclude_unset=True).items():
            setattr(order, key, value)

        if payload.payment_method and payload.paid_amount is not None:
            if order.payment:
                order.payment.method = payload.payment_method
                order.payment.amount_due = order.total_amount
                order.payment.amount_paid = payload.paid_amount
                order.payment.change_amount = max(payload.paid_amount - order.total_amount, Decimal("0"))
            else:
                payment = Payment(
                    order=order,
                    method=payload.payment_method,
                    amount_due=order.total_amount,
                    amount_paid=payload.paid_amount,
                    change_amount=max(payload.paid_amount - order.total_amount, Decimal("0")),
                )
                db.add(payment)

        db.commit()
        db.refresh(order)
        return order

    @app.delete("/order/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
        order = db.get(Order, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        db.delete(order)
        db.commit()

    @app.get("/order/{order_id}/receipt", response_model=Receipt)
    def get_receipt(order_id: int, db: Session = Depends(get_db)) -> Receipt:
        order = db.get(Order, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
        if not order.payment:
            raise HTTPException(status_code=400, detail="결제가 완료되지 않은 주문입니다.")
        return generate_receipt(order, STORE_NAME)

    # ------------------ Employees ------------------ #
    @app.get("/employees", response_model=List[EmployeeOut])
    def list_employees(db: Session = Depends(get_db)) -> List[Employee]:
        employees = db.execute(select(Employee).order_by(Employee.role.desc(), Employee.name)).scalars().all()
        return employees

    @app.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
    def create_employee(payload: CreateEmployeeRequest, db: Session = Depends(get_db)) -> Employee:
        employee = Employee(**payload.dict())
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    @app.post("/employee/start", response_model=ClockResponse)
    def start_shift(payload: ClockEvent, db: Session = Depends(get_db)) -> ClockResponse:
        manager = EmployeeManager(db)
        shift = manager.start_shift(payload.employee_id)
        db.commit()
        db.refresh(shift)
        return ClockResponse(
            shift_id=shift.id,
            employee_id=shift.employee_id,
            status="IN_PROGRESS",
            clock_in=shift.clock_in,
            clock_out=shift.clock_out,
        )

    @app.post("/employee/end", response_model=ClockResponse)
    def end_shift(payload: ClockEvent, db: Session = Depends(get_db)) -> ClockResponse:
        manager = EmployeeManager(db)
        try:
            shift = manager.end_shift(payload.employee_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        db.commit()
        db.refresh(shift)
        return ClockResponse(
            shift_id=shift.id,
            employee_id=shift.employee_id,
            status="COMPLETED",
            clock_in=shift.clock_in,
            clock_out=shift.clock_out,
        )

    @app.get("/employee/payroll", response_model=List[PayrollSummary])
    def payroll(db: Session = Depends(get_db)) -> List[PayrollSummary]:
        manager = EmployeeManager(db)
        return manager.payroll_summary()

    # ------------------ Sales ------------------ #
    @app.get("/sales/summary", response_model=SalesDashboardResponse)
    def sales_summary(period: str = Query("DAILY"), db: Session = Depends(get_db)) -> SalesDashboardResponse:
        manager = SalesManager(db)
        return manager.summarize(period=period)

    @app.exception_handler(ValueError)
    def handle_value_error(_: ValueError, exc: ValueError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    return app


app = create_app()

