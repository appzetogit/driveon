import Banner from '../models/Banner.js';
import Car from '../models/Car.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import mongoose from 'mongoose';

/**
 * @desc    Get All Banners (Admin)
 * @route   GET /api/admin/banners
 * @access  Private/Admin
 */
export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find({})
      .populate('linkedCar', 'brand model registrationNumber pricePerDay')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { banners },
    });
  } catch (error) {
    console.error('Get all banners (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message,
    });
  }
};

/**
 * @desc    Create New Banner (Admin)
 * @route   POST /api/admin/banners
 * @access  Private/Admin
 */
export const createBanner = async (req, res) => {
  try {
    const { title, linkedCar } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Banner title is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image file is required',
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(req.file, {
      folder: 'driveon/banners',
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to Cloudinary',
      });
    }

    // Validate linkedCar ID if provided
    let carId = null;
    if (linkedCar && linkedCar !== 'null' && linkedCar !== 'undefined' && linkedCar !== '') {
      if (mongoose.Types.ObjectId.isValid(linkedCar)) {
        const carExists = await Car.findById(linkedCar);
        if (!carExists) {
          return res.status(404).json({
            success: false,
            message: 'Linked car not found',
          });
        }
        carId = linkedCar;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid linked car ID format',
        });
      }
    }

    const banner = new Banner({
      title: title.trim(),
      image: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      linkedCar: carId,
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: { banner },
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
};

/**
 * @desc    Update Banner (Admin)
 * @route   PUT /api/admin/banners/:id
 * @access  Private/Admin
 */
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, linkedCar } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }

    // Validate and set linkedCar
    if (linkedCar !== undefined) {
      if (linkedCar === '' || linkedCar === 'null' || linkedCar === 'undefined' || linkedCar === null) {
        updateData.linkedCar = null;
      } else if (mongoose.Types.ObjectId.isValid(linkedCar)) {
        const carExists = await Car.findById(linkedCar);
        if (!carExists) {
          return res.status(404).json({
            success: false,
            message: 'Linked car not found',
          });
        }
        updateData.linkedCar = linkedCar;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid linked car ID format',
        });
      }
    }

    // If new image file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary first
      if (banner.cloudinaryPublicId) {
        try {
          await deleteImage(banner.cloudinaryPublicId);
        } catch (delErr) {
          console.error('Failed to delete old banner image from Cloudinary:', delErr);
        }
      }

      // Upload new image
      const uploadResult = await uploadImage(req.file, {
        folder: 'driveon/banners',
      });

      if (!uploadResult || !uploadResult.secure_url) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload new image to Cloudinary',
        });
      }

      updateData.image = uploadResult.secure_url;
      updateData.cloudinaryPublicId = uploadResult.public_id;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('linkedCar', 'brand model registrationNumber pricePerDay');

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner: updatedBanner },
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete Banner (Admin)
 * @route   DELETE /api/admin/banners/:id
 * @access  Private/Admin
 */
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    // Delete image from Cloudinary
    if (banner.cloudinaryPublicId) {
      try {
        await deleteImage(banner.cloudinaryPublicId);
      } catch (delErr) {
        console.error('Failed to delete banner image from Cloudinary:', delErr);
      }
    }

    await Banner.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle Banner Active Status (Admin)
 * @route   PATCH /api/admin/banners/:id/toggle
 * @access  Private/Admin
 */
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner status marked as ${banner.isActive ? 'active' : 'inactive'}`,
      data: { banner },
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Active Banners (Public)
 * @route   GET /api/common/banners/active
 * @access  Public
 */
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .populate('linkedCar', 'brand model images pricePerDay averageRating seatingCapacity location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { banners },
    });
  } catch (error) {
    console.error('Get active banners (public) error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active banners',
      error: error.message,
    });
  }
};
