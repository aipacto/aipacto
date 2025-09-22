terraform {
	required_version = ">= 1.13.0, < 2.0.0"
	
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.52.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.10.1"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.7.2"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}


