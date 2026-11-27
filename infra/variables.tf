# The directory's identifiers are not secrets, but they identify the maintainer's directory, so they stay out of Git:
# the workflows pass them from GitHub variables as TF_VAR_ (design D-4). Without them the plan still runs; the apps then
# lack sign-in until they are set.

variable "auth_authority" {
  description = "External ID authority, https://<subdomain>.ciamlogin.com/<tenant-id> with no trailing slash (docs/operations/identity.md)."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)

  validation {
    # The seeding job's DirectoryId is the last path segment (apps.tf): a trailing slash or a domain would seed nobody.
    condition     = var.auth_authority == null || can(regex("^https://[^/]+/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.auth_authority))
    error_message = "auth_authority must be https://<subdomain>.ciamlogin.com/<tenant-id>, with no trailing slash."
  }
}

variable "auth_api_audience" {
  description = "Audience of herald-api's tokens."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)
}

variable "auth_api_scope" {
  description = "The admin application's scope on herald-api (api://<id>/access_as_user)."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)
}

variable "auth_admin_client_id" {
  description = "herald-admin's client id."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)
}

variable "persona_main_object_id" {
  description = "Object id of the owner persona the seeding job seeds for (ADR 0019, D-21)."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)
}

variable "databases_onboarded" {
  description = "True once Steward's operator has created herald_main and herald_preview (onboard-herald group 5): the plan imports them. Never set it back to false: the databases are protected from destruction."
  type        = bool
  default     = false
}

variable "persona_rival_object_id" {
  description = "Object id of the second owner persona, of another organisation (isolation)."
  type        = string
  default     = null
  sensitive   = true # kept out of the public plan log (design D-4)
}
