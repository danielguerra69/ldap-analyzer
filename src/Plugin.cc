// Generated by binpac_quickstart

#include "plugin/Plugin.h"

#include "LDAP.h"

namespace plugin {
namespace Bro_LDAP {

class Plugin : public plugin::Plugin {
public:
	plugin::Configuration Configure()
		{
		AddComponent(new ::analyzer::Component("LDAP",
		             ::analyzer::LDAP::LDAP_Analyzer::InstantiateAnalyzer));

		plugin::Configuration config;
		config.name = "Bro::LDAP";
		config.description = "Lightweight Directory Access Protocol analyzer";
		return config;
		}
} plugin;

}
}