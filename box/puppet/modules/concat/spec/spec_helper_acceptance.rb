require 'beaker-rspec/spec_helper'
require 'beaker-rspec/helpers/serverspec'

unless ENV['RS_PROVISION'] == 'no' or ENV['BEAKER_provision'] == 'no'
  # This will install the latest available package on el and deb based
  # systems fail on windows and osx, and install via gem on other *nixes
  foss_opts = {:default_action => 'gem_install'}

  if default.is_pe?; then
    install_pe;
  else
    install_puppet(foss_opts);
  end

  hosts.each do |host|
    on hosts, "mkdir -p #{host['distmoduledir']}"
    if host['platform'] =~ /sles-1/i || host['platform'] =~ /solaris-1/i
      get_stdlib = <<-EOS
      package{'wget':}
      exec{'download':
        command => "wget -P /root/ https://forgeapi.puppetlabs.com/v3/files/puppetlabs-stdlib-4.3.2.tar.gz --no-check-certificate",
        path    => ['/opt/csw/bin/','/usr/bin/']
      }
      EOS
      apply_manifest_on(host, get_stdlib)
      # have to use force otherwise it checks ssl cert even though it is a local file
      on host, puppet('module install /root/puppetlabs-stdlib-4.3.2.tar.gz --force --ignore-dependencies'), {:acceptable_exit_codes => [0, 1]}
    elsif host['platform'] =~ /windows/i
      on host, shell('curl -k -o c:/puppetlabs-stdlib-4.3.2.tar.gz https://forgeapi.puppetlabs.com/v3/files/puppetlabs-stdlib-4.3.2.tar.gz')
      on host, puppet('module install c:/puppetlabs-stdlib-4.3.2.tar.gz --force --ignore-dependencies'), {:acceptable_exit_codes => [0, 1]}
    else
      on host, puppet('module install puppetlabs-stdlib'), {:acceptable_exit_codes => [0, 1]}
    end
  end
end

RSpec.configure do |c|
  # Project root
  proj_root = File.expand_path(File.join(File.dirname(__FILE__), '..'))

  # Readable test descriptions
  c.formatter = :documentation

  # Configure all nodes in nodeset
  c.before :suite do
    hosts.each do |host|
      copy_module_to(host, :source => proj_root, :module_name => 'concat')
    end
  end

  c.before(:all) do
    shell('mkdir -p /tmp/concat')
  end
  c.after(:all) do
    shell('rm -rf /tmp/concat /var/lib/puppet/concat')
  end

  c.treat_symbols_as_metadata_keys_with_true_values = true
end
