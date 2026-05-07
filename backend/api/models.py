from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    ORDER_STATUS = (
        ('active', 'Active'),
        ('done', 'Done'),
    )

    order_number = models.CharField(max_length=64, blank=True)
    table = models.CharField(max_length=64, blank=True)
    items = models.JSONField(default=list)
    status = models.CharField(max_length=16, choices=ORDER_STATUS, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure created_at is available and generate a stable order_number when missing
        if not self.order_number:
            from django.utils import timezone
            now = timezone.now()
            # use millisecond-precision timestamp to avoid collisions
            self.order_number = f"#{int(now.timestamp() * 1000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} - {self.table}"
