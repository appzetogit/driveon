import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String, // e.g., "Battery", "Tyres", "Fluid"
            required: true,
            index: true,
        },
        supplier: {
            type: String,
            trim: true,
        },
        unitCost: {
            type: Number,
            required: true,
            min: 0,
        },
        stockLevel: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        unit: {
            type: String,
            default: 'Units',
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
        }
    },
    {
        timestamps: true,
    }
);

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
