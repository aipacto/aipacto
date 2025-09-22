terraform {
  required_version = ">= 1.13.0, < 2.0.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.52.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }

  # Terraform remote state (S3-compatible)
  backend "s3" {
    endpoints = {
      "s3" = "https://fsn1.your-objectstorage.com"
    }
    bucket                      = "aipacto-terraform-state"
    key                         = "k3s/terraform.tfstate"
    region                      = "eu-central-1"  # Just a placeholder, not used for some S3-compatible backends (e.g. Hetzner)
    use_path_style              = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
  }
}

provider "hcloud" {
  token = var.hcloud_token
}
