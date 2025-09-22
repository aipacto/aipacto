terraform {
	# Terraform remote state
  backend "s3" {
    endpoints = {
      "s3" = "https://fsn1.your-objectstorage.com"
    }
    bucket                      = "aipacto-terraform-state"
    key                         = "simple/production/terraform.tfstate"
    region                      = "eu-central-1"  # Just a placeholder, not used for some S3-compatible backends (e.g. Hetzner)
    use_path_style              = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
  }
}
