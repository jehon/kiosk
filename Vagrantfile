# -*- mode: ruby -*-
# vi: set ft=ruby :

KIOSK_APP = "/app/kiosk"

# Use: vagrant --production -- up --provision
envProduction=false
for arg in ARGV
	if arg == "--production"
		envProduction=true
		puts "** In production like environement"
	end
end

Vagrant.configure("2") do |config|
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "generic/debian9"

  config.vm.synced_folder ".", "#{KIOSK_APP}/", create: true

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  config.vm.network "forwarded_port", guest: 3000, host: 3000 # Server
  config.vm.network "forwarded_port", guest: 9876, host: 9876 # Karma debug

  # See https://www.vagrantup.com/docs/vagrantfile/ssh_settings.html
  config.ssh.forward_x11 = true

  config.vm.provision "shell", inline: "/bin/chmod +x #{KIOSK_APP}/bin/*", run: "always"
  unless envProduction
    config.vm.provision "shell", inline: "/bin/bash #{KIOSK_APP}/bin/kiosk-dev.sh"
  end
  
  config.vm.provision "shell", inline: "/bin/bash #{KIOSK_APP}/bin/kiosk-initialize.sh"
end
