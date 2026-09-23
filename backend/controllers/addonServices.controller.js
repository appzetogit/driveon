import AddOnServices from '../models/AddOnServices.js';
import CustomAddOnService from '../models/CustomAddOnService.js';

/**
 * @desc    Get add-on services prices (Public)
 * @route   GET /api/addon-services/prices
 * @access  Public
 */
export const getAddOnServicesPrices = async (req, res) => {
  try {
    const prices = await AddOnServices.getPrices();
    
    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error('Error fetching add-on services prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on services prices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get add-on services prices (Admin)
 * @route   GET /api/admin/addon-services/prices
 * @access  Private (Admin)
 */
export const getAdminAddOnServicesPrices = async (req, res) => {
  try {
    const prices = await AddOnServices.getPrices();
    
    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error('Error fetching add-on services prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on services prices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update add-on services prices (Admin)
 * @route   PUT /api/admin/addon-services/prices
 * @access  Private (Admin)
 */
export const updateAddOnServicesPrices = async (req, res) => {
  try {
    const prices = req.body;

    // Validate prices
    for (const [key, value] of Object.entries(prices)) {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for service key "${key}"`,
        });
      }
    }

    const updatedPrices = await AddOnServices.updatePrices(prices);

    res.json({
      success: true,
      message: 'Add-on services prices updated successfully',
      data: updatedPrices,
    });
  } catch (error) {
    console.error('Error updating add-on services prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update add-on services prices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============ DYNAMIC ADD-ON SERVICES CRUD ============

/**
 * @desc    Get all dynamic add-on services with their providers (Admin/Public)
 * @route   GET /api/admin/addon-services
 * @access  Private (Admin) or Public
 */
export const getAddOnServices = async (req, res) => {
  try {
    const services = await AddOnServices.find().sort({ createdAt: 1 });
    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching add-on services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on services',
    });
  }
};

/**
 * @desc    Create a new dynamic add-on service
 * @route   POST /api/admin/addon-services
 * @access  Private (Admin)
 */
export const createAddOnService = async (req, res) => {
  try {
    const { name, description, price, singleUnitOnly } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Service name and price are required',
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
    }

    // Generate unique key from name (only lowercase letters and numbers)
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service name. Name must contain alphanumeric characters.',
      });
    }

    // Check if key already exists
    const existing = await AddOnServices.findOne({ key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A service with a similar name ("${existing.name}") already exists.`,
      });
    }

    const service = await AddOnServices.create({
      name,
      key,
      description: description || '',
      price: parsedPrice,
      singleUnitOnly: singleUnitOnly === undefined ? false : !!singleUnitOnly,
      providers: [],
    });

    res.status(201).json({
      success: true,
      message: 'Add-on service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error creating add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create add-on service',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a dynamic add-on service
 * @route   PUT /api/admin/addon-services/:id
 * @access  Private (Admin)
 */
export const updateAddOnService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, singleUnitOnly } = req.body;

    const service = await AddOnServices.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Add-on service not found',
      });
    }

    if (name !== undefined) {
      service.name = name;
      // Optionally regenerate key if name changes, but usually keys should remain stable
    }
    if (description !== undefined) {
      service.description = description;
    }
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number',
        });
      }
      service.price = parsedPrice;
    }
    if (singleUnitOnly !== undefined) {
      service.singleUnitOnly = !!singleUnitOnly;
    }

    await service.save();

    res.json({
      success: true,
      message: 'Add-on service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error updating add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update add-on service',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a dynamic add-on service
 * @route   DELETE /api/admin/addon-services/:id
 * @access  Private (Admin)
 */
export const deleteAddOnService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await AddOnServices.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Add-on service not found',
      });
    }

    res.json({
      success: true,
      message: 'Add-on service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting add-on service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete add-on service',
      error: error.message,
    });
  }
};

// ============ PROVIDERS REGISTRY MANAGEMENT ============

/**
 * @desc    Add a provider under a specific service
 * @route   POST /api/admin/addon-services/:id/providers
 * @access  Private (Admin)
 */
export const addProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required',
      });
    }

    if (phone.length !== 10 || isNaN(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits',
      });
    }

    const service = await AddOnServices.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Add provider
    service.providers.push({
      name,
      phone,
      email: email || '',
      address: address || '',
      isActive: true,
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Provider registered successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error registering provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register provider',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a provider from a specific service
 * @route   DELETE /api/admin/addon-services/:id/providers/:providerId
 * @access  Private (Admin)
 */
export const deleteProvider = async (req, res) => {
  try {
    const { id, providerId } = req.params;

    const service = await AddOnServices.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const initialLen = service.providers.length;
    service.providers = service.providers.filter(p => p._id.toString() !== providerId);

    if (service.providers.length === initialLen) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    await service.save();

    res.json({
      success: true,
      message: 'Provider removed successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error removing provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove provider',
      error: error.message,
    });
  }
};

// ============ Custom Add-On Services CRUD ============

/**
 * @desc    Get all custom add-on services
 * @route   GET /api/admin/addon-services/custom
 * @access  Public
 */
export const getCustomAddOnServices = async (req, res) => {
  try {
    const services = await CustomAddOnService.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { services } });
  } catch (error) {
    console.error('Error fetching custom services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

/**
 * @desc    Create custom add-on service
 * @route   POST /api/admin/addon-services/custom
 * @access  Private (Admin)
 */
export const createCustomAddOnService = async (req, res) => {
  try {
    const { name, phone, email, address, pricePerUnit } = req.body;

    if (!name || !phone || !email || !pricePerUnit) {
      return res.status(400).json({ success: false, message: 'Name, Phone, Email and Price are required' });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const service = await CustomAddOnService.create({ name, phone, email, address, pricePerUnit });
    res.status(201).json({ success: true, data: { service } });
  } catch (error) {
    console.error('Error creating custom service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

/**
 * @desc    Update custom add-on service
 * @route   PUT /api/admin/addon-services/custom/:id
 * @access  Private (Admin)
 */
export const updateCustomAddOnService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await CustomAddOnService.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: { service } });
  } catch (error) {
    console.error('Error updating custom service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

/**
 * @desc    Delete custom add-on service
 * @route   DELETE /api/admin/addon-services/custom/:id
 * @access  Private (Admin)
 */
export const deleteCustomAddOnService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await CustomAddOnService.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};
