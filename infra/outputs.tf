# Read by the deployment workflow (m4-deploy). No principal or object id: apply logs are public, and Steward's operator
# reads the slot identities with `az identity show` (its docs/m3/operations.md).

output "registry" { value = local.registry.login_server }

output "slots" {
  value = { for slot, s in local.slots : slot => {
    api      = azurerm_container_app.this["${slot}-api"].name
    public   = azurerm_container_app.this["${slot}-public"].name
    admin    = azurerm_container_app.this["${slot}-admin"].name
    job      = azurerm_container_app_job.seed[slot].name
    identity = azurerm_user_assigned_identity.api[slot].name
    urls     = { public = local.urls[slot].public, admin = local.urls[slot].admin }
  } }
}
