import Policy from '../models/Policy.js';

/**
 * @desc    Get all policies
 * @route   GET /api/admin/policies
 * @access  Private (Admin)
 */
export const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find({}).sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: {
        policies,
      },
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policies',
      error: error.message,
    });
  }
};

/**
 * @desc    Get policy by key
 * @route   GET /api/common/policies/:key or GET /api/admin/policies/:key
 * @access  Public
 */
export const getPolicyByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Policy key is required',
      });
    }

    const policy = await Policy.findOne({ key });
    
    // Not an error - policy simply hasn't been configured yet by the admin
    // Return 200 with null so the frontend falls back to static content gracefully
    if (!policy) {
      return res.json({
        success: true,
        data: null,
        message: `Policy "${key}" has not been configured yet`,
      });
    }

    res.json({
      success: true,
      data: {
        ...policy.toObject(),
      },
    });
  } catch (error) {
    console.error(`Get policy by key (${req.params.key}) error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policy',
      error: error.message,
    });
  }
};

/**
 * @desc    Create or update policy by key
 * @route   PUT /api/admin/policies/:key
 * @access  Private (Admin)
 */
export const updatePolicy = async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Policy key is required',
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    // Find and update, or create if not exists
    const policy = await Policy.findOneAndUpdate(
      { key },
      { title, content },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Policy updated successfully',
      data: {
        policy,
      },
    });
  } catch (error) {
    console.error(`Update policy (${req.params.key}) error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating policy',
      error: error.message,
    });
  }
};
