using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;

namespace SimpleWebServer
{
    class Program
    {
        private static HttpListener listener;
        private static readonly string url = "http://localhost:8080/";
        
        static async Task Main(string[] args)
        {
            Console.WriteLine("Starting Simple C# Web Server...");
            Console.WriteLine($"Listening on {url}");
            Console.WriteLine("Press Ctrl+C to stop the server\n");
            
            listener = new HttpListener();
            listener.Prefixes.Add(url);
            
            try
            {
                listener.Start();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error starting server: {ex.Message}");
                return;
            }
            
            while (true)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    _ = Task.Run(() => ProcessRequest(context));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
        }
        
        static void ProcessRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;
            
            Console.WriteLine($"{DateTime.Now:HH:mm:ss} - {request.HttpMethod} {request.Url.AbsolutePath}");
            
            string responseString = "";
            string contentType = "text/plain";
            
        // Handle API endpoints
        if (request.Url.AbsolutePath == "/api/upload" && request.HttpMethod == "POST")
        {
            responseString = HandleFileUpload(request);
            contentType = "application/json";
            response.StatusCode = 200;
        }
        else if (request.Url.AbsolutePath == "/api/quote" && request.HttpMethod == "POST")
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                string body = reader.ReadToEnd();
                responseString = CalculateQuote(body);
                contentType = "application/json";
                response.StatusCode = 200;
            }
        }
        else if (request.Url.AbsolutePath == "/api/order" && request.HttpMethod == "POST")
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                string body = reader.ReadToEnd();
                responseString = CreateOrder(body);
                contentType = "application/json";
                response.StatusCode = 200;
            }
        }
        else if (request.Url.AbsolutePath.StartsWith("/api/order/") && request.HttpMethod == "GET")
        {
            string orderId = request.Url.AbsolutePath.Substring("/api/order/".Length);
            responseString = GetOrder(orderId);
            contentType = "application/json";
            response.StatusCode = 200;
        }
        else if (request.Url.AbsolutePath == "/api/orders" && request.HttpMethod == "GET")
        {
            responseString = GetAllOrders();
            contentType = "application/json";
            response.StatusCode = 200;
        }
        else if (request.Url.AbsolutePath == "/api/status" && request.HttpMethod == "POST")
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                string body = reader.ReadToEnd();
                responseString = UpdateOrderStatus(body);
                contentType = "application/json";
                response.StatusCode = 200;
            }
        }
        else if (request.Url.AbsolutePath == "/api/stats" && request.HttpMethod == "GET")
        {
            responseString = GetStats();
            contentType = "application/json";
            response.StatusCode = 200;
        }
        else
        {
            // Serve static files from wwwroot directory
            string filePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "wwwroot", request.Url.AbsolutePath.TrimStart('/'));
            
            if (request.Url.AbsolutePath == "/")
            {
                filePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "wwwroot", "index.html");
            }
            
            if (File.Exists(filePath))
            {
                responseString = File.ReadAllText(filePath);
                contentType = GetContentType(filePath);
                response.StatusCode = 200;
            }
            else
            {
                responseString = "404 - Not Found";
                response.StatusCode = 404;
            }
        }
            
            // Set headers
            response.ContentType = contentType + "; charset=utf-8";
            response.ContentEncoding = Encoding.UTF8;
            
            // Write response
            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
            response.ContentLength64 = buffer.Length;
            using (var output = response.OutputStream)
            {
                output.Write(buffer, 0, buffer.Length);
            }
        }
        
        static string GetSampleData()
        {
            var data = new
            {
                items = new[]
                {
                    new { id = 1, name = "Item 1", description = "First sample item" },
                    new { id = 2, name = "Item 2", description = "Second sample item" },
                    new { id = 3, name = "Item 3", description = "Third sample item" }
                },
                count = 3,
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(data);
        }
        
        static string GetCurrentTime()
        {
            var time = new
            {
                currentTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                timezone = "Europe/Bucharest",
                timestamp = DateTimeOffset.Now.ToUnixTimeSeconds()
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(time);
        }
        
        static string ProcessContactForm(string body)
        {
            var response = new
            {
                message = "Thank you for your message! We'll get back to you soon.",
                receivedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                status = "success"
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(response);
        }
        
        // 3D Printing API Methods
        static string HandleFileUpload(HttpListenerRequest request)
        {
            // Mock file upload - in real app, this would save the file
            var response = new
            {
                success = true,
                message = "File uploaded successfully",
                filename = "uploaded_model.stl",
                size = 1024 * 1024, // 1MB
                estimatedVolume = 45.2,
                uploadedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(response);
        }
        
        static string CalculateQuote(string body)
        {
            try
            {
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(body);
                double volume = data.volume ?? 0;
                string material = data.material ?? "PLA";
                int quantity = data.quantity ?? 1;
                
                // Price calculation
                double baseFee = 5.00;
                double materialRate = GetMaterialRate(material);
                double materialCost = volume * materialRate;
                double total = (baseFee + materialCost) * quantity;
                
                var quote = new
                {
                    success = true,
                    volume = volume,
                    material = material,
                    materialRate = materialRate,
                    quantity = quantity,
                    baseFee = baseFee,
                    materialCost = materialCost,
                    total = Math.Round(total, 2),
                    breakdown = new
                    {
                        baseFee = baseFee,
                        materialCost = materialCost,
                        total = Math.Round(total, 2)
                    },
                    calculatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                };
                
                return Newtonsoft.Json.JsonConvert.SerializeObject(quote);
            }
            catch (Exception ex)
            {
                var error = new
                {
                    success = false,
                    error = "Failed to calculate quote",
                    message = ex.Message
                };
                return Newtonsoft.Json.JsonConvert.SerializeObject(error);
            }
        }
        
        static string CreateOrder(string body)
        {
            try
            {
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(body);
                
                // Generate order ID
                string orderId = "ORD-" + DateTime.Now.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);
                
                var order = new
                {
                    success = true,
                    orderId = orderId,
                    customerName = data.customerName ?? "Customer",
                    customerEmail = data.customerEmail ?? "",
                    fileName = data.fileName ?? "model.stl",
                    material = data.material ?? "PLA",
                    quantity = data.quantity ?? 1,
                    volume = data.volume ?? 0,
                    price = data.price ?? 0,
                    status = "pending",
                    orderDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    estimatedDelivery = DateTime.Now.AddDays(7).ToString("yyyy-MM-dd"),
                    message = "Order created successfully. Your 3D print is now in production."
                };
                
                return Newtonsoft.Json.JsonConvert.SerializeObject(order);
            }
            catch (Exception ex)
            {
                var error = new
                {
                    success = false,
                    error = "Failed to create order",
                    message = ex.Message
                };
                return Newtonsoft.Json.JsonConvert.SerializeObject(error);
            }
        }
        
        static string GetOrder(string orderId)
        {
            // Mock order data - in real app, this would come from a database
            var order = new
            {
                success = true,
                orderId = orderId,
                customerName = "John Smith",
                customerEmail = "john@example.com",
                fileName = "gear.stl",
                material = "PLA",
                quantity = 2,
                volume = 45.2,
                price = 23.56,
                status = "printing",
                orderDate = "2024-01-15 10:30:00",
                estimatedDelivery = "2024-01-22",
                shippingAddress = "123 Main St, Bucharest, Romania",
                statusHistory = new[]
                {
                    new { status = "pending", date = "2024-01-15 10:30:00", notes = "Order received" },
                    new { status = "processing", date = "2024-01-15 14:20:00", notes = "File approved for printing" },
                    new { status = "printing", date = "2024-01-16 09:15:00", notes = "Printing started" }
                }
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(order);
        }
        
        static string GetAllOrders()
        {
            // Mock orders data - in real app, this would come from a database
            var orders = new[]
            {
                new
                {
                    orderId = "ORD-1001",
                    customerName = "John Smith",
                    customerEmail = "john@example.com",
                    fileName = "gear.stl",
                    material = "PLA",
                    quantity = 2,
                    volume = 45.2,
                    price = 23.56,
                    status = "printing",
                    orderDate = "2024-01-15 10:30:00"
                },
                new
                {
                    orderId = "ORD-1002",
                    customerName = "Sarah Johnson",
                    customerEmail = "sarah@example.com",
                    fileName = "bracket.stl",
                    material = "ABS",
                    quantity = 1,
                    volume = 28.7,
                    price = 15.05,
                    status = "shipping",
                    orderDate = "2024-01-14 14:20:00"
                },
                new
                {
                    orderId = "ORD-1003",
                    customerName = "Mike Wilson",
                    customerEmail = "mike@example.com",
                    fileName = "miniature.stl",
                    material = "Resin",
                    quantity = 3,
                    volume = 12.5,
                    price = 35.00,
                    status = "delivered",
                    orderDate = "2024-01-13 09:15:00"
                }
            };
            
            var response = new
            {
                success = true,
                orders = orders,
                count = orders.Length,
                retrievedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(response);
        }
        
        static string UpdateOrderStatus(string body)
        {
            try
            {
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(body);
                string orderId = data.orderId;
                string newStatus = data.status;
                
                var response = new
                {
                    success = true,
                    orderId = orderId,
                    oldStatus = "pending", // In real app, this would be retrieved from database
                    newStatus = newStatus,
                    updatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    message = $"Order {orderId} status updated to {newStatus}"
                };
                
                return Newtonsoft.Json.JsonConvert.SerializeObject(response);
            }
            catch (Exception ex)
            {
                var error = new
                {
                    success = false,
                    error = "Failed to update order status",
                    message = ex.Message
                };
                return Newtonsoft.Json.JsonConvert.SerializeObject(error);
            }
        }
        
        static string GetStats()
        {
            var stats = new
            {
                success = true,
                totalOrders = 15,
                pendingOrders = 3,
                processingOrders = 2,
                printingOrders = 5,
                shippingOrders = 3,
                deliveredOrders = 2,
                totalRevenue = 456.78,
                averageOrderValue = 30.45,
                popularMaterial = "PLA",
                retrievedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            return Newtonsoft.Json.JsonConvert.SerializeObject(stats);
        }
        
        static double GetMaterialRate(string material)
        {
            switch (material.ToUpper())
            {
                case "PLA": return 0.25;
                case "ABS": return 0.35;
                case "PETG": return 0.40;
                case "RESIN": return 0.80;
                case "TPU": return 0.45;
                case "NYLON": return 0.55;
                default: return 0.25;
            }
        }
        
        static string GetContentType(string filePath)
        {
            string extension = Path.GetExtension(filePath).ToLower();
            
            switch (extension)
            {
                case ".html": return "text/html";
                case ".css": return "text/css";
                case ".js": return "application/javascript";
                case ".json": return "application/json";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                default: return "text/plain";
            }
        }
    }
}
