terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider for the Mumbai region
provider "aws" {
  region = "ap-south-1"
}

# Create a security group to allow SSH, HTTP, and Backend API traffic
resource "aws_security_group" "hackathon_sg" {
  name        = "hackathon_sg"
  description = "Allow inbound traffic for SSH, HTTP, and API"

  # SSH access from anywhere
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP access for potential frontend testing
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API access
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic (needed for apt-get and docker pulls)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hackathon-security-group"
  }
}

# Provision the EC2 Instance
resource "aws_instance" "hackathon_server" {
  # Ubuntu Server 26.04 LTS (HVM), SSD Volume Type in ap-south-1
  ami           = "ami-01a00762f46d584a1" 
  instance_type = "t3.micro"
  
  # Ensure you have generated this key pair in AWS before applying
  key_name      = "fal-key"

  vpc_security_group_ids = [aws_security_group.hackathon_sg.id]

  # Allocate an 8GB root volume
  root_block_device {
    volume_size = 8
    volume_type = "gp3"
  }

  tags = {
    Name = "TenzorX-Hackathon-Backend"
  }
}

# Output the public IP after creation so you can update inventory.ini
output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.hackathon_server.public_ip
}