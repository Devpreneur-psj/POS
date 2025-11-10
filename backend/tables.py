from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class MenuCategory(str, Enum):  # type: ignore[misc]
    COCKTAIL = "COCKTAIL"
    LIQUOR = "LIQUOR"
    BEVERAGE = "BEVERAGE"


class PaymentMethod(str, Enum):  # type: ignore[misc]
    CASH = "CASH"
    CARD = "CARD"


class EmployeeRole(str, Enum):  # type: ignore[misc]
    OWNER = "OWNER"
    STAFF = "STAFF"


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(20), nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    inventory_item = relationship("Inventory", uselist=False, back_populates="menu_item")
    order_items = relationship("OrderItem", back_populates="menu_item")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    name = Column(String(100), unique=True, nullable=False)
    unit = Column(String(20), nullable=True)
    quantity = Column(Float, default=0.0, nullable=False)
    threshold = Column(Float, default=5.0, nullable=False)

    menu_item = relationship("MenuItem", back_populates="inventory_item")


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    capacity = Column(Integer, default=2, nullable=False)

    orders = relationship("Order", back_populates="table")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    nickname = Column(String(50), nullable=False)

    feedback = relationship("CustomerFeedback", back_populates="customer")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    hourly_wage = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    shifts = relationship("Shift", back_populates="employee")


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    clock_in = Column(DateTime, default=datetime.utcnow, nullable=False)
    clock_out = Column(DateTime, nullable=True)

    employee = relationship("Employee", back_populates="shifts")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)
    total_amount = Column(Numeric(10, 2), default=0, nullable=False)
    payment_method = Column(String(10), nullable=True)
    paid_amount = Column(Numeric(10, 2), nullable=True)
    change_amount = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("CustomerFeedback", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    method = Column(String(10), nullable=False)
    amount_due = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    change_amount = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="payment")


class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    order = relationship("Order", back_populates="feedback")
    customer = relationship("Customer", back_populates="feedback")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_between_1_5"),
        UniqueConstraint("order_id", name="unique_feedback_per_order"),
    )


class DailySalesSnapshot(Base):
    __tablename__ = "daily_sales_snapshots"

    id = Column(Integer, primary_key=True)
    snapshot_date = Column(Date, unique=True, nullable=False)
    total_sales = Column(Numeric(10, 2), default=0, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    avg_rating = Column(Float, nullable=True)


class InventoryAlert(Base):
    __tablename__ = "inventory_alerts"

    id = Column(Integer, primary_key=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    message = Column(Text, nullable=False)

    inventory = relationship("Inventory")
