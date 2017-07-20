## This is where we define the LDAP PDU structure according to RFC 4511

%include analyzer/protocol/asn1/asn1.pac

# PDU that includes all LDAP protocol operation types.  'what_prot' will 
# determine which operation is used in this packet.

type Common_PDU(is_orig: bool) = record {
	messageID       : ASN1Integer;
	protocolOp_meta : ASN1EncodingMeta;
	what_prot       : PDU(protocolOp_meta.tag, messageID, is_orig);
};

type PDU(choice: uint8, messageID: ASN1Integer, is_orig: bool) = case choice of {
	#PDU Choices from RFC 4511
	0x60    -> bind_req   : BindReqPDU(messageID, is_orig);
	0x61    -> bind_res   : BindResPDU(messageID, is_orig);
	0x66    -> mod_req    : ModifyReqPDU(messageID);
	0x67    -> mod_res    : ModifyResPDU(messageID);
	0x68    -> add_req    : AddReqPDU(messageID);
	0x69    -> add_res    : AddResPDU(messageID);
	0x6a    -> del_req    : DeleteReqPDU(messageID);
	0x6b    -> del_res    : DeleteResPDU(messageID);
	0x6c    -> modDN_req  : ModifyDNReqPDU(messageID);
	0x6d    -> modDN_res  : ModifyDNResPDU(messageID);
	default -> unknown    : UnknownOp(choice); 
};

# Bind Request- handled by bind analyzer
type BindReqPDU(messageID: ASN1Integer, is_orig: bool) = record {
	version     : ASN1Integer;
	name        : ASN1OctetString;
	appmeta     : ASN1EncodingMeta;
	mechanism   : ASN1OctetString;
	gssapi_meta : ASN1EncodingMeta; #04
	gssapi      : bytestring &length=gssapi_meta.length;
};

type BindResPDU(messageID: ASN1Integer, is_orig: bool) = record  {
	result    : LDAPResult(messageID);
	sasl_meta : ASN1EncodingMeta;
	meta      : ASN1EncodingMeta;
	seq_meta  : ASN1SequenceMeta;
	obj       : ASN1Encoding;
	meta2     : ASN1EncodingMeta;
	oid       : ASN1ObjectIdentifier;
	meta3     : ASN1EncodingMeta;
	meta4     : ASN1EncodingMeta;
	meta5     : ASN1EncodingMeta;
	oid2      : ASN1ObjectIdentifier;
	blob      : bytestring &restofdata;
};

# Modify Request
type ModifyReqPDU(messageID : ASN1Integer) = record {
	object  : ASN1OctetString;
	big_seq : ASN1SequenceMeta;
	mods    : ModificationControl[];

};

# In some packets, we have seen a control section after the list of 
# Modifications.  Therefore, we need to determine whether or not we are 
# grabbing a Modification or we're at the end of the packet with a control.  
# Since the control has been at the end, taking the rest of the data for that.
type ModificationControl = record {
	meta           : ASN1EncodingMeta;
	appmeta1       : uint8;
	appmeta2       : uint8;
	mod_or_control : case appmeta1 of {
		0x0a    -> mod  : Modification;
		default -> data : bytestring &restofdata &transient;
	};
};

# The actual item of a list of Modifications.
type Modification = record {
	op          : uint8;
	partialmeta : ASN1SequenceMeta;
	type        : ASN1OctetString;
	valmeta     : ASN1EncodingMeta;
	val         : ASN1OctetString;
};

# Modify Response
type ModifyResPDU(messageID: ASN1Integer) = record {
	result : LDAPResult(messageID);
};

# Modify DN Request
type ModifyDNReqPDU(messageID: ASN1Integer) = record {
	entry        : ASN1OctetString;
	newrdn       : ASN1OctetString;
	boolmeta     : uint16;
	deleteoldrdn : uint8;
	stringmeta   : uint8;
	stringlen    : uint8;
	newSuperior  : bytestring &length = stringlen;
};

# Modify DN Response
type ModifyDNResPDU(messageID: ASN1Integer) = record {
	result : LDAPResult(messageID);
};

# Delete Request
type DeleteReqPDU(messageID: ASN1Integer) = record {
	request : bytestring &restofdata;
};

# Delete Response
type DeleteResPDU(messageID: ASN1Integer) = record {
	result : LDAPResult(messageID);
};

# Add Request
type AddReqPDU(messageID: ASN1Integer) = record {
	entry      : ASN1OctetString;
	attributes : AttributeList;
};

# Meta for AttributeList and holds the array of Attributes.
type AttributeList = record {
	meta : ASN1SequenceMeta;
	atts : Attribute[];
};

# In case some configurations want to include a control after the list of 
# Attributes like we saw in Modify Request, we are checking for when we get 
# something that doesn't look like an Attribute.  We are treating the rest of 
# the data like a control.
type Attribute = record {
	header        : ASN1SequenceMeta;
	control_check : case header.encoding.tag of {
		0x30    -> att     : AttributeItem;
		default -> control : bytestring &restofdata &transient;
	};	
};

# The actual Attribute item we care about.
type AttributeItem = record {
	type   : ASN1OctetString;
	valseq : ASN1EncodingMeta;
	val    : ASN1OctetString;
};

# Add Response
type AddResPDU(messageID: ASN1Integer) = record  {
	result : LDAPResult(messageID);
};

# LDAP Result.  This is what all of the responses actually use.
type LDAPResult(messageID: ASN1Integer) = record  {
	result_meta : uint16;
	result      : uint8;
	matchedDN   : ASN1OctetString;
	error       : ASN1OctetString;
};

type UnknownOp(choice: uint8) = record {
	data : bytestring &restofdata &transient;
}
