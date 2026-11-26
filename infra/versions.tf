terraform {
  required_version = "~> 1.13.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.12"
    }
  }
}

provider "azurerm" {
  features {}
  # id-herald-delivery is Contributor on rg-herald only, so it cannot register providers: infra/bootstrap.sh does.
  resource_provider_registrations = "none"
  # Steward's management account has shared keys off; the backend and the provider use Entra.
  storage_use_azuread = true
}
