﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Sweco.Services.MapExport
{
    public class WMSInfo
    {
        private string _url = "";
        public string url
        {
            get
            {
                return this._url;
            }
            set
            {
                string replacer = "gwc/service/";
                Regex regex = new Regex(replacer);
                // Remove the GWC-part from geoserver url if specified.
                if (regex.IsMatch(value))
                {
                    // This in an assumption that there is an equalient url at the rool level of geoserver.
                    value = value.Replace(replacer, "");
                }
                this._url = value;
            }
        }
        public int zIndex { get; set; }
        public string workspacePrefix { get; set; }
        public List<string> layers { get; set; }
        public int coordinateSystemId { get; set; }   
    }
}
