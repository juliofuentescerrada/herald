#!/usr/bin/env bash
# Prepares what Herald needs before Steward's onboarding can grant on it (ADR 0012): the resource providers Herald's
# resources use and the resource group rg-herald, with the tags Steward's manifest (config/bootstrap.json, consumer
# herald) checks before granting on it. Steward's own bootstrap creates the state container, the delivery identity
# id-herald-delivery, its federated credentials and its grants. Run once by the operator, signed in with `az login` as
# Owner of the subscription. Idempotent: a second run changes nothing.
set -euo pipefail

location=northeurope
resource_group=rg-herald
repository=juliofuentescerrada/herald
tags=(owner=juliofuentescerrada repository=herald workload=herald environment=poc managed-by=bootstrap)

subscription=$(az account show --query id -o tsv)
tenant=$(az account show --query tenantId -o tsv)

# The delivery identity is Contributor on one resource group, so it can't register providers on the subscription.
for provider in Microsoft.App Microsoft.Consumption Microsoft.Insights Microsoft.ManagedIdentity; do
  az provider register --namespace "$provider" --output none
done

az group create --name "$resource_group" --location "$location" --tags "${tags[@]}" --output none

# The identity exists once Steward's onboarding has run; until then there is no client id to print.
client_id=$(az identity show --name id-herald-delivery --resource-group rg-management --query clientId -o tsv 2>/dev/null || true)

cat <<OUT

Bootstrap done. Once Steward's onboarding has created id-herald-delivery, set the repository variables:

  gh variable set AZURE_CLIENT_ID --body ${client_id:-<client id of id-herald-delivery>} -R $repository
  gh variable set AZURE_TENANT_ID --body $tenant -R $repository
  gh variable set AZURE_SUBSCRIPTION_ID --body $subscription -R $repository
OUT
