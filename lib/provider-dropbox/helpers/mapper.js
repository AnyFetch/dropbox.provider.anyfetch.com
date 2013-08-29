'use strict';
/**
 * @file Maps gd$ values to clean keys.
 */

/**
 * Extract the value after the "#".
 * For instance, "http://schemas.google.com/g/2005#mobile" becomes "mobile".
 * 
 * @param {String} val Value to extract. It is assumed it contains a hashbang.
 * @return {String} Value after the hashbang.
 */
var postHashbang = function(val) {
  return val.substr(val.indexOf('#') + 1);
};

/**
 * Maps datas from google awful soup to "clean" JS.
 * 
 * Special value : .url for the contact url, .deleted if the contact has been deleted.
 *
 * @param {Object} c Google object
 * @return {Object} Clean object
 */
module.exports = function (c) {
  var r = {};

  // Extract meaningful datas
  r.id = c.id['$t'];

  if(c['gd$name']){
    if(c['gd$name']['gd$fullName']) {
      r.name = c['gd$name']['gd$fullName']['$t'];
    }
    if(c['gd$name']['gd$givenName']) {
      r.given_name = c['gd$name']['gd$givenName']['$t'];
    }
    if(c['gd$name']['gd$familyName']) {
      r.family_name = c['gd$name']['gd$familyName']['$t'];
    }
  }

  if (c['gContact$nickname']) {
    r.nickname = c['gContact$nickname']['$t'];
  }

  if (c['gd$email']) {
    r.email = c['gd$email'].map(function(m) {
      return {
        'type': m.rel ? postHashbang(m.rel) : m.label,
        'email': m.address
      };
    });
  }

  if(c['gd$phoneNumber']) {
    r.phone = c['gd$phoneNumber'].map(function(p) {
      return {
        'type': p.rel ? postHashbang(p.rel) : p.label,
        'phone': p['$t'],
      };
    });
  }

  if(c['gd$im']) {
    r.im = c['gd$im'].map(function(p) {
      return {
        'type': p.protocol ? postHashbang(p.protocol) : p.label,
        'address': p.address,
      };
    });
  }

  if(c['gContact$birthday']) {
    r.birthday = new Date(c['gContact$birthday'].when);
  }

  if(c['gContact$website']) {
    r.website = c['gContact$website'].map(function(w) {
      return w.href;
    });
  }

  if(c['gd$organization'] && c['gd$organization'][0]) {
    if(c['gd$organization'][0]['gd$orgTitle']) {
      r.jobTitle = c['gd$organization'][0]['gd$orgTitle']['$t'];
      }

    if(c['gd$organization'][0]['gd$orgName']) {
      r.worksFor = c['gd$organization'][0]['gd$orgName']['$t'];
    }
  }

  if(c['gd$structuredPostalAddress']) {
    r.address = c['gd$structuredPostalAddress'].map(function(a) {
      return {
        'type': a.rel ? postHashbang(a.rel) : a.label,
        'address': a['gd$formattedAddress']['$t']
      };
    });
  }

  if(c['gd$deleted']) {
    r.deleted = true;
  }

  // Compute additional datas
  var re = new RegExp('/([^/]+\\%40[^/]+)/.+/([0-9a-f]+)$');
  var results = re.exec(r.id);
  r.url = 'https://mail.google.com/mail/b/' + results[1].replace('%40', '@') + '/#contact/' + results[2];

  return r;
};
