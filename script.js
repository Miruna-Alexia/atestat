// 3DPrintNow - Main JavaScript File
// This file contains shared functionality across all pages

// Global utility functions
const Utils = {
    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // Format file size
    formatFileSize: function(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    
    // Format date
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Generate order ID
    generateOrderId: function() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}${random}`;
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('global-notification');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'global-notification';
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    max-width: 400px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid #4ECDC4;
                }
                
                .notification-success {
                    border-left-color: #00B894;
                }
                
                .notification-error {
                    border-left-color: #FF6B6B;
                }
                
                .notification-info {
                    border-left-color: #4ECDC4;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }
                
                .notification-content i {
                    font-size: 1.2rem;
                }
                
                .notification-success .notification-content i {
                    color: #00B894;
                }
                
                .notification-error .notification-content i {
                    color: #FF6B6B;
                }
                
                .notification-info .notification-content i {
                    color: #4ECDC4;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 0.25rem;
                    margin-left: 1rem;
                }
                
                .notification-close:hover {
                    color: #333;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Add slideOut animation
        if (!document.getElementById('notification-animations')) {
            const animations = document.createElement('style');
            animations.id = 'notification-animations';
            animations.textContent = `
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(animations);
        }
    },
    
    // Validate email
    validateEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Order management
const OrderManager = {
    // Save order to localStorage
    saveOrder: function(orderData) {
        try {
            // Get existing orders
            let orders = JSON.parse(localStorage.getItem('3dprintnow_orders') || '[]');
            
            // Add new order
            orders.push(orderData);
            
            // Save back to localStorage
            localStorage.setItem('3dprintnow_orders', JSON.stringify(orders));
            
            // Also save for admin access
            localStorage.setItem('admin_orders', JSON.stringify(orders));
            
            return true;
        } catch (error) {
            console.error('Error saving order:', error);
            return false;
        }
    },
    
    // Get order by ID
    getOrder: function(orderId) {
        try {
            const orders = JSON.parse(localStorage.getItem('3dprintnow_orders') || '[]');
            return orders.find(order => order.orderId === orderId);
        } catch (error) {
            console.error('Error getting order:', error);
            return null;
        }
    },
    
    // Get all orders
    getAllOrders: function() {
        try {
            return JSON.parse(localStorage.getItem('3dprintnow_orders') || '[]');
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    },
    
    // Update order status
    updateOrderStatus: function(orderId, newStatus) {
        try {
            let orders = JSON.parse(localStorage.getItem('3dprintnow_orders') || '[]');
            const orderIndex = orders.findIndex(order => order.orderId === orderId);
            
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                orders[orderIndex].updatedAt = new Date().toISOString();
                
                // Save updated orders
                localStorage.setItem('3dprintnow_orders', JSON.stringify(orders));
                localStorage.setItem('admin_orders', JSON.stringify(orders));
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating order:', error);
            return false;
        }
    }
};

// File upload handling
const FileUploader = {
    // Setup drag and drop
    setupDragAndDrop: function(uploadAreaId, fileInputId, onFileSelect) {
        const uploadArea = document.getElementById(uploadAreaId);
        const fileInput = document.getElementById(fileInputId);
        
        if (!uploadArea || !fileInput) return;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.classList.add('dragover');
        }
        
        function unhighlight() {
            uploadArea.classList.remove('dragover');
        }
        
        // Handle dropped files
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                handleFiles(files);
            }
        }
        
        // Handle file input change
        fileInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                handleFiles(this.files);
            }
        });
        
        // Click to upload
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        function handleFiles(files) {
            const file = files[0];
            
            // Validate file
            if (!file.name.toLowerCase().endsWith('.stl')) {
                Utils.showNotification('Please upload an STL file (.stl extension)', 'error');
                return;
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB
                Utils.showNotification('File too large. Maximum size is 50MB.', 'error');
                return;
            }
            
            // Call callback with file
            if (typeof onFileSelect === 'function') {
                onFileSelect(file);
            }
        }
    },
    
    // Calculate estimated volume from file size (mock)
    estimateVolume: function(fileSize) {
        // Simple heuristic: larger files tend to have more volume
        // This is just for demo purposes
        const sizeInKB = fileSize / 1024;
        const baseVolume = 10;
        const sizeFactor = sizeInKB * 0.5;
        const randomFactor = Math.random() * 20;
        
        return Math.max(10, baseVolume + sizeFactor + randomFactor);
    }
};

// Price calculator
const PriceCalculator = {
    // Material prices per cm³
    materialPrices: {
        PLA: 0.25,
        ABS: 0.35,
        PETG: 0.40,
        Resin: 0.80,
        TPU: 0.45,
        Nylon: 0.55
    },
    
    // Base processing fee
    baseFee: 5.00,
    
    // Calculate price
    calculate: function(volume, material, quantity = 1) {
        const materialRate = this.materialPrices[material] || this.materialPrices.PLA;
        const materialCost = volume * materialRate;
        const total = (this.baseFee + materialCost) * quantity;
        
        return {
            volume: volume,
            material: material,
            materialRate: materialRate,
            materialCost: materialCost,
            baseFee: this.baseFee,
            quantity: quantity,
            total: total,
            breakdown: {
                base: this.baseFee,
                material: materialCost,
                total: total
            }
        };
    },
    
    // Get all materials
    getMaterials: function() {
        return Object.keys(this.materialPrices).map(key => ({
            id: key.toLowerCase(),
            name: key,
            pricePerCm3: this.materialPrices[key],
            color: this.getMaterialColor(key)
        }));
    },
    
    // Get material color
    getMaterialColor: function(material) {
        const colors = {
            PLA: '#FF6B6B',
            ABS: '#4ECDC4',
            PETG: '#FFD166',
            Resin: '#1A535C',
            TPU: '#9B5DE5',
            Nylon: '#00BBF9'
        };
        return colors[material] || '#666';
    }
};

// Status tracking
const StatusTracker = {
    // Status definitions
    statuses: [
        { id: 'pending', name: 'Order Received', description: 'We have received your order and payment.', icon: 'fas fa-clipboard-check', color: '#FFD166' },
        { id: 'processing', name: 'File Processing', description: 'Our team is reviewing your STL file.', icon: 'fas fa-cogs', color: '#4ECDC4' },
        { id: 'printing', name: '3D Printing', description: 'Your model is being printed.', icon: 'fas fa-print', color: '#FF6B6B' },
        { id: 'quality', name: 'Quality Check', description: 'Print is being inspected for quality.', icon: 'fas fa-search', color: '#9B5DE5' },
        { id: 'shipping', name: 'Shipping', description: 'Your print is packaged and shipped.', icon: 'fas fa-shipping-fast', color: '#00BBF9' },
        { id: 'delivered', name: 'Delivered', description: 'Your print has been delivered!', icon: 'fas fa-home', color: '#00B894' }
    ],
    
    // Get status by ID
    getStatus: function(statusId) {
        return this.statuses.find(s => s.id === statusId) || this.statuses[0];
    },
    
    // Get status badge class
    getStatusBadgeClass: function(statusId) {
        const classes = {
            pending: 'status-pending',
            processing: 'status-processing',
            printing: 'status-printing',
            quality: 'status-processing',
            shipping: 'status-shipped',
            delivered: 'status-delivered'
        };
        return classes[statusId] || 'status-pending';
    },
    
    // Get status text
    getStatusText: function(statusId) {
        const texts = {
            pending: 'Pending',
            processing: 'Processing',
            printing: 'Printing',
            quality: 'Quality Check',
            shipping: 'Shipping',
            delivered: 'Delivered'
        };
        return texts[statusId] || 'Pending';
    },
    
    // Create timeline HTML
    createTimeline: function(currentStatus) {
        const currentIndex = this.statuses.findIndex(s => s.id === currentStatus);
        
        let html = '<div class="status-timeline">';
        
        this.statuses.forEach((status, index) => {
            let stepClass = 'status-step';
            if (index < currentIndex) stepClass += ' completed';
            if (index === currentIndex) stepClass += ' active';
            
            html += `
                <div class="${stepClass}">
                    <div class="status-dot" style="background-color: ${status.color};">
                        <i class="${status.icon}"></i>
                    </div>
                    <div class="status-label">${status.name}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
};

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update current time on pages that need it
    const timeElements = document.querySelectorAll('.current-time');
    if (timeElements.length > 0) {
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            timeElements.forEach(el => {
                el.textContent = `${dateString} ${timeString}`;
            });
        }
        
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const title = this.getAttribute('title');
            if (title) {
                // Create tooltip element
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = title;
                tooltip.style.position = 'absolute';
                tooltip.style.background = 'rgba(0,0,0,0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '0.5rem 0.75rem';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '0.85rem';
                tooltip.style.zIndex = '10000';
                tooltip.style.whiteSpace = 'nowrap';
                
                // Position tooltip
                const rect = this.getBoundingClientRect();
                tooltip.style.top = (rect.top - 40) + 'px';
                tooltip.style.left = (rect.left + (rect.width / 2)) + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                
                // Add to page
                document.body.appendChild(tooltip);
                this.tooltipElement = tooltip;
                
                // Remove title attribute to prevent default tooltip
                this.removeAttribute('title');
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (this.tooltipElement) {
                this.tooltipElement.remove();
                this.tooltipElement = null;
            }
        });
    });
});

// Export utilities to global scope
window.Utils = Utils;
window.OrderManager = OrderManager;
window.FileUploader = FileUploader;
window.PriceCalculator = PriceCalculator;
window.StatusTracker = StatusTracker;