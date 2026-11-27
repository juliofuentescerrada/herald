# The slot databases on the shared server. Steward's operator creates them with their migrator roles (onboard-herald
# group 5) and Herald imports them: the delivery identity may manage these databases and nothing else on the server.
locals {
  databases = var.databases_onboarded ? toset([for s in local.slots : s.database]) : toset([])
}

import {
  for_each = local.databases
  to       = azurerm_postgresql_flexible_server_database.this[each.key]
  id       = "${local.postgres.id}/databases/${each.key}"
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  for_each  = local.databases
  name      = each.key
  server_id = local.postgres.id
  charset   = "UTF8"
  collation = "en_US.utf8"

  lifecycle {
    # Created by the onboarding script with the server's defaults; a difference must not replace a database.
    ignore_changes = [charset, collation]
    # databases_onboarded set back to false must not drop a slot's data.
    prevent_destroy = true
  }
}

# PostgreSQL, the registry and the logs are billed to Steward's rg-shared; rg-herald's usage costs cents idle, so this
# is an early warning (decision session of 22 November 2026).
resource "azurerm_consumption_budget_resource_group" "monthly" {
  name              = "budget-herald"
  resource_group_id = data.azurerm_resource_group.this.id
  amount            = 10
  time_grain        = "Monthly"

  time_period {
    start_date = "2026-11-01T00:00:00Z"
  }

  dynamic "notification" {
    for_each = { actual-80 = ["Actual", 80], actual-100 = ["Actual", 100], forecast-100 = ["Forecasted", 100] }
    content {
      threshold_type = notification.value[0]
      threshold      = notification.value[1]
      operator       = "GreaterThanOrEqualTo"
      # The resource group's owners by e-mail, inherited from the subscription: no address in the code.
      contact_roles = ["Owner"]
    }
  }
}
