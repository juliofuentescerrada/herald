# Herald's state in Steward's management account, container herald: only id-herald-delivery and the operator read it.
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-management"
    storage_account_name = "stjfcmanagement"
    container_name       = "herald"
    key                  = "platform.tfstate"
    use_azuread_auth     = true
  }
}
