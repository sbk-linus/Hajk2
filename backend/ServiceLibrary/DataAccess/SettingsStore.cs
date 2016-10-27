﻿using System;
using System.Linq;
using System.Data;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations.Schema;
using Sweco.Services.DataContracts;
using System.Web.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Sweco.Services.DataContracts.ToolOptions;
using System.Collections.Generic;

namespace Sweco.Services.DataAccess
{      
    [Table("Bookmark")]
    class DataBookmark
    {
        [Key]
        [DatabaseGenerated(System.ComponentModel.DataAnnotations.Schema.DatabaseGeneratedOption.Identity)]
        [DataMember]
        public int Id { get; set; }

        /// <summary>
        /// Is the bookmark favourite
        /// </summary>            
        [DataMember(Name = "favourite")]
        public bool Favourite { get; set; }

        /// <summary>
        /// User who owns the bookmark
        /// </summary>
        [Required(ErrorMessage="Username is required")]
        [DataMember(Name = "username")]
        public string Username { get; set; }
            
        /// <summary>
        /// Name of the bookmark
        /// </summary>
        [Required(ErrorMessage = "Name is required")]
        [DataMember(Name = "name")]
        public string Name { get; set; }
            
        /// <summary>
        /// Blob of settings.
        /// </summary>
        [Required(ErrorMessage = "Settings is required")]
        [DataMember(Name = "settings")]
        [MaxLength]
        public string Settings { get; set; }
    }

    sealed class SettingsDbContext : DbContext
    {
        private string mapFile = "map_1.json";
        private string layerFile = "layers.json";
        /// <summary>
        /// Read layer config from JSON-file
        /// </summary>
        /// <returns></returns>
        private LayerConfig readLayerConfigFromFile()
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
            string jsonInput = System.IO.File.ReadAllText(file);
            return JsonConvert.DeserializeObject<LayerConfig>(jsonInput);
        }

        /// <summary>
        /// Read config from JSON-file
        /// </summary>
        /// <returns></returns>
        private MapConfig readMapConfigFromFile()
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.mapFile);
            string jsonInput = System.IO.File.ReadAllText(file);
            return JsonConvert.DeserializeObject<MapConfig>(jsonInput);
        }

        /// <summary>
        /// Save config as JSON-file
        /// </summary>
        /// <param name="mapConfig"></param>
        private void saveMapConfigToFile(MapConfig mapConfig)
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.mapFile);
            string jsonOutput = JsonConvert.SerializeObject(mapConfig, Formatting.Indented);
            System.IO.File.WriteAllText(file, jsonOutput);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layerConfig"></param>
        private void saveLayerConfigToFile(LayerConfig layerConfig) 
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
            string jsonOutput = JsonConvert.SerializeObject(layerConfig, Formatting.Indented);
            System.IO.File.WriteAllText(file, jsonOutput);
        }
            
        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        /// <param name="groups"></param>
        private void removeLayer(string id, List<LayerGroup> groups)
        {
            groups.ForEach(group => {                    
                MapWMSLayerInfo layer = group.layers.FirstOrDefault(l => l.id == id);
                if (layer != null)
                {
                    group.layers.Remove(layer);                        
                }
                else
                {
                    if (group.groups != null)
                    {
                        this.removeLayer(id, group.groups);
                    }
                }
            });                
        }
            
        /// <summary>
        /// Remove baselayer
        /// </summary>
        /// <param name="id"></param>
        /// <param name="layers"></param>
        private void removeLayer(string id, List<string> layers)
        {                
            var layer = layers.FirstOrDefault(l => l == id);
            if (layer != null)
            {
                layers.Remove(layer);
            }
        }

        /// <summary>
        /// Property bookmarks.
        /// </summary>
        public DbSet<DataBookmark> Bookmarks { get { return Set<DataBookmark>(); } }            

        /// <summary>
        /// Constructor
        /// </summary>
        public SettingsDbContext() 
            : base("SettingsDatabase")
        {
        }

        /// <summary>
        /// Get bookmars for users by username.
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        public Bookmark[] GetBookmarks(string username)
        {
            DataBookmark[] dataBookmarks = this.Bookmarks.Where(b => b.Username == username).ToArray();                
            var bookmarks = dataBookmarks.Select(bookmark => {
                return new Bookmark()
                {
                    id = bookmark.Id,
                    name = bookmark.Name,
                    username = bookmark.Username,
                    settings = bookmark.Settings,
                    favourite = bookmark.Favourite
                };
            });
            return bookmarks.OrderBy(a => a.name).ToArray();
        }

        /// <summary>
        /// Add new bookmark.
        /// </summary>
        /// <param name="bookmark"></param>
        public void SaveBookmark(Bookmark bookmark) 
        {
            DataBookmark dataBookmark = new DataBookmark() {
                Id = bookmark.id,
                Name = bookmark.name,
                Username = bookmark.username,
                Settings = bookmark.settings,
                Favourite = bookmark.favourite
            };
            this.Bookmarks.Add(dataBookmark);
            this.SaveChanges();
        }

        /// <summary>
        /// Update existing bookmark by ID.
        /// </summary>
        /// <param name="id"></param>
        /// <param name="bookmark"></param>
        public void UpdateBookmark(Bookmark bookmark)
        {
            var userBookmarks = this.Bookmarks.Where(b => b.Username == bookmark.username);
            foreach (var b in userBookmarks)
            {
                b.Favourite = false;
            }
                
            DataBookmark dataBookmark = this.Bookmarks.Where(b => b.Id == bookmark.id).FirstOrDefault();

            if (bookmark != null)
            {
                dataBookmark.Favourite = bookmark.favourite;                 
                dataBookmark.Id = bookmark.id;                    
                dataBookmark.Name = bookmark.name;
                dataBookmark.Settings = bookmark.settings;
                dataBookmark.Username = bookmark.username;
                this.SaveChanges();
            }
        }

        /// <summary>
        /// Remove existing bookmark by ID.
        /// </summary>
        /// <param name="id"></param>
        public void RemoveBookmark(int id) 
        {                
            DataBookmark bookmark = this.Bookmarks.Where(b => b.Id == id).FirstOrDefault();
            if (bookmark != null) {
                this.Bookmarks.Remove(bookmark);
                this.SaveChanges();
            }
        }
       
        /// <summary>
        /// Add wms layer
        /// </summary>
        /// <param name="layer"></param>
        public void AddWMSLayer(WMSConfig layer) 
        {                                
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layerConfig.wmslayers.Add(layer);  
            this.saveLayerConfigToFile(layerConfig);              
        }

        /// <summary>
        /// Add wmts layer
        /// </summary>
        /// <param name="layer"></param>
        public void AddWMTSLayer(WMTSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            if (layerConfig.wmtslayers == null)
            {
                layerConfig.wmtslayers = new List<WMTSConfig>();
            }
            layerConfig.wmtslayers.Add(layer);

            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WMS-layer with new config-options.
        /// </summary>
        /// <param name="layer"></param>
        public void UpdateWMSLayer(WMSConfig layer)
        {                
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wmslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wmslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WMS-layer with new config-options.
        /// </summary>
        /// <param name="layer"></param>
        public void UpdateWMTSLayer(WMTSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wmtslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wmtslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Removes WMS-layer from config
        /// </summary>
        /// <param name="id"></param>
        private void removeLayerFromConfig(string id) 
        {
            MapConfig config = readMapConfigFromFile();
            var tool = config.tools.Find(t => t.type == "layerswitcher");                
            LayerMenuOptions options = JsonConvert.DeserializeObject<LayerMenuOptions>(tool.options.ToString());                                                
            this.removeLayer(id, options.groups);
            this.removeLayer(id, options.baselayers);
            config.tools.Where(t => t.type == "layerswitcher").FirstOrDefault().options = options;
            this.saveMapConfigToFile(config);
        }

        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        public void RemoveWMSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();                
            this.removeLayerFromConfig(id);
            var index = layerConfig.wmslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wmslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        public void RemoveWMTSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wmtslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wmtslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update layer menu
        /// </summary>
        /// <param name="layerMenu"></param>
        public void UpdateLayerMenu(LayerMenuOptions layerMenu)
        {
            MapConfig config = readMapConfigFromFile();
            var tool = config.tools.Find(t => t.type == "layerswitcher");
            tool.options = layerMenu;
            this.saveMapConfigToFile(config);
        }

        /// <summary>
        /// Remove WFS-layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveWFSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wfslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wfslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WFS-layer
        /// </summary>
        /// <param name="layer"></param>
        internal void UpdateWFSLayer(WFSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wfslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wfslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWFSLayer(WFSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layerConfig.wfslayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig); ;
        }

        /// <summary>
        /// Remove WFS-layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveWFSTLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wfstlayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wfstlayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WFS-layer
        /// </summary>
        /// <param name="layer"></param>
        internal void UpdateWFSTLayer(WFSTConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wfstlayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wfstlayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWFSTLayer(WFSTConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layerConfig.wfstlayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig);
        }
    }
}