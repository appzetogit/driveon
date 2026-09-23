import mongoose from 'mongoose';

const crmRoleSchema = new mongoose.Schema(
    {
        roleName: {
            type: String,
            required: [true, 'Role name is required'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        accessLevel: {
            type: String,
            enum: [
                'Full Access',
                'Read Only',
                'Custom',
                'Cars, Bookings, Garage',
                'Finance, Reports',
                'Bookings (Read Only)',
                'Basic',
                'Intermediate'
            ],
            default: 'Read Only',
        },
        category: {
            type: String,
            enum: ['Management', 'Operations', 'Finance', 'Sales'],
            default: 'Operations',
        },
        permissions: [{
            type: String,
        }],
    },
    {
        timestamps: true,
    }
);

const CRMRole = mongoose.model('CRMRole', crmRoleSchema);

export default CRMRole;
