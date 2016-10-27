﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class MapSetting
    {
        public string target { get; set; }        
        public int[] center { get; set; }
        public string projection { get; set; }
        public int zoom { get; set; }
        public int maxZoom { get; set; }
        public int minZoom { get; set; }
        public double[] resolutions { get; set; }
        public double[] origin { get; set; }
        public double[] extent { get; set; }
        public string logo { get; set; }
    }
}
