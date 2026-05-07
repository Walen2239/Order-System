# Components Study Guide

This project is a multi-screen ordering system with one Django backend and three Next.js frontends. The backend stores and serves data, while the frontends show different views of the same order flow.

## Big Picture

- Service creates and manages live orders.
- Kitchen watches incoming orders and uses timer warnings.
- Cashier tracks orders and manages categories/listing items.
- Backend connects everything through API endpoints and MongoDB.

## Backend Files

### `backend/api/views.py`
This is the main backend logic file.

- `CategoryViewSet` handles listing, creating, and deleting categories.
- `ListingItemViewSet` handles listing, creating, and deleting listing items.
- `OrderViewSet` handles listing, creating, and marking orders as done.
- It also formats order data before sending it to the frontends.

### `backend/api/serializers.py`
This file checks and cleans incoming request data.

- It makes sure category, listing item, and order data has the right shape.
- It helps prevent bad or incomplete data from being saved.

### `backend/api/mongo.py`
This file connects Django to MongoDB.

- It creates the Mongo client.
- It gives the rest of the backend access to the database.

### `backend/api/urls.py`
This file defines the API routes.

- It registers the endpoints for orders, categories, and listing items.
- It lets the frontends call the backend with clean URLs.

## Service Frontend

### `frontend-service/pages/index.js`
This is the main service screen.

- It fetches active orders from the backend every few seconds.
- It shows each order in a card layout.
- It lets the user click an order item to toggle its done state visually.
- It sends toggle updates to the backend so the kitchen can see them too.
- It handles the service banner colors based on the timer tone.

### `frontend-service/components/Countdown.js`
This component shows the countdown timer for each order.

- It reads the order `createdAt` time.
- It counts down from 20 minutes.
- It changes text color by time range.
- It sends the current tone back to the page with `onToneChange`.

### `frontend-service/components/Nav.js`
This is the navigation bar.

- It helps move between service pages.

### `frontend-service/pages/orders.js`
This page is used for order-related views in the service app.

- It is part of the service side navigation and order workflow.

## Cashier Frontend

### `frontend-cashier/pages/index.js`
This is the main cashier screen.

- It shows order cards coming from the backend.
- It gives a local-only `Check` effect so the cashier can mark what they have already seen.
- It does not use a countdown anymore.
- It still keeps the cards in sync with service and kitchen through polling.

### `frontend-cashier/pages/listing.js`
This is the category and listing management screen.

- It lets the cashier create categories.
- It lets the cashier create listing items.
- It lets the cashier delete categories and listing items.
- It shows goods and sauces in the same category system.

### `frontend-cashier/components/Nav.js`
This is the cashier navigation bar.

- It links the cashier pages together.

## Kitchen Frontend

### `frontend-kitchen/pages/index.js`
This is the kitchen order queue screen.

- It fetches active orders from the backend on a timer.
- It shows each order as a large card.
- It uses the countdown tone to switch the top warning banner.
- It reflects service item toggle updates so kitchen staff can track progress.

### `frontend-kitchen/components/Countdown.js`
This component shows the timer in the kitchen.

- It counts down from 20 minutes.
- It changes color based on time remaining.
- It helps the kitchen know when orders are getting old.

### `frontend-kitchen/components/Nav.js`
This is the kitchen navigation bar.

- It lets the user move around the kitchen app.

## Support Files

### `frontend-service/utils/`, `frontend-cashier/utils/`, `frontend-kitchen/utils/`
These folders contain helper data and small utility functions.

- `mockData.js` is sample data for development.
- `tableNumberGenerator.js` helps generate or manage table numbers where used.

## How the Components Work Together

1. The backend stores the real data.
2. The service creates and updates orders.
3. The kitchen reads the same orders and shows time warnings.
4. The cashier tracks orders and manages categories/listing items.
5. All screens poll the backend so they stay synchronized.

## Short Presentation Summary

- Backend = data storage and API.
- Service = order creation and item tracking.
- Cashier = order monitoring plus category/listing management.
- Kitchen = active queue and time warnings.
