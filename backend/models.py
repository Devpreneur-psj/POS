from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class MenuItemBase(BaseModel):
    name: str
    category: str
    base_price: Decimal = Field(..., ge=0)
    description: Optional[str] = None
    is_active: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MenuItemOut(MenuItemBase):
    id: int

    class Config:
        orm_mode = True


class InventoryBase(BaseModel):
    name: str
    unit: Optional[str] = None
    quantity: float = Field(..., ge=0)
    threshold: float = Field(..., ge=0)


class InventoryUpdate(BaseModel):
    quantity: Optional[float] = Field(None, ge=0)
    threshold: Optional[float] = Field(None, ge=0)


class InventoryOut(InventoryBase):
    id: int
    menu_item_id: Optional[int]

    class Config:
        orm_mode = True


class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemOut(OrderItemBase):
    id: int
    unit_price: Decimal

    class Config:
        orm_mode = True


class OrderBase(BaseModel):
    table_id: int
    status: str = "PENDING"
    items: List[OrderItemCreate]
    payment_method: Optional[str] = None
    paid_amount: Optional[Decimal] = None
    change_amount: Optional[Decimal] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None
    payment_method: Optional[str] = None
    paid_amount: Optional[Decimal] = None
    change_amount: Optional[Decimal] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class PaymentOut(BaseModel):
    method: str
    amount_due: Decimal
    amount_paid: Decimal
    change_amount: Decimal
    paid_at: datetime

    class Config:
        orm_mode = True


class OrderOut(BaseModel):
    id: int
    table_id: int
    status: str
    total_amount: Decimal
    payment_method: Optional[str]
    paid_amount: Optional[Decimal]
    change_amount: Optional[Decimal]
    created_at: datetime
    items: List[OrderItemOut]
    payment: Optional[PaymentOut]
    rating: Optional[int] = None
    comment: Optional[str] = None

    class Config:
        orm_mode = True


class EmployeeBase(BaseModel):
    name: str
    role: str
    hourly_wage: Decimal = Field(..., ge=0)


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeOut(EmployeeBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True


class ShiftOut(BaseModel):
    id: int
    employee_id: int
    clock_in: datetime
    clock_out: Optional[datetime]
    worked_hours: float

    class Config:
        orm_mode = True


class PayrollSummary(BaseModel):
    employee_id: int
    employee_name: str
    total_hours: float
    total_pay: Decimal


class SalesSummary(BaseModel):
    total_revenue: Decimal
    total_orders: int
    average_order_value: Decimal
    average_rating: Optional[float]
    period: str
    top_menu_items: List[dict]


class SalesTrendPoint(BaseModel):
    label: str
    value: Decimal


class SalesDashboardResponse(BaseModel):
    summary: SalesSummary
    daily: List[SalesTrendPoint]
    weekly: List[SalesTrendPoint]
    monthly: List[SalesTrendPoint]
    yearly: List[SalesTrendPoint]


class ReceiptLine(BaseModel):
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class Receipt(BaseModel):
    store_name: str
    table_name: str
    items: List[ReceiptLine]
    total_amount: Decimal
    payment_method: str
    paid_amount: Decimal
    change_amount: Decimal
    thank_you_message: str


class ClockEvent(BaseModel):
    employee_id: int


class ClockResponse(BaseModel):
    shift_id: int
    employee_id: int
    status: str
    clock_in: datetime
    clock_out: Optional[datetime]


class InventoryAlertOut(BaseModel):
    inventory_id: int
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        orm_mode = True
