﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class Tool
    {
        public string type { get; set; }
        public object options { get; set; }
    }   
}