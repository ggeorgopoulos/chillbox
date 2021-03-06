#############################################################
#
# Build the ext2 root filesystem image
#
#############################################################

EXT2_OPTS :=

ifneq ($(strip $(BR2_TARGET_ROOTFS_EXT2_BLOCKS)),0)
EXT2_OPTS += -b $(BR2_TARGET_ROOTFS_EXT2_BLOCKS)
endif

ifneq ($(strip $(BR2_TARGET_ROOTFS_EXT2_INODES)),0)
EXT2_OPTS += -N $(BR2_TARGET_ROOTFS_EXT2_INODES)
endif

ifneq ($(strip $(BR2_TARGET_ROOTFS_EXT2_RESBLKS)),0)
EXT2_OPTS += -m $(BR2_TARGET_ROOTFS_EXT2_RESBLKS)
endif

ROOTFS_EXT2_DEPENDENCIES = host-genext2fs host-e2fsprogs

EXT2_ENV  = GEN=$(BR2_TARGET_ROOTFS_EXT2_GEN)
EXT2_ENV += REV=$(BR2_TARGET_ROOTFS_EXT2_REV)

define ROOTFS_EXT2_CMD
	PATH=$(TARGET_PATH) $(EXT2_ENV) fs/ext2/genext2fs.sh -d $(TARGET_DIR) $(EXT2_OPTS) $@
endef

define ROOTFS_EXT2_HOOK_SYMLINK
	ln -sf rootfs.ext2 $(BINARIES_DIR)/rootfs.ext$(BR2_TARGET_ROOTFS_EXT2_GEN)
endef
ifneq ($(BR2_TARGET_ROOTFS_EXT2_GEN),2)
ROOTFS_EXT2_POST_GEN_HOOKS += ROOTFS_EXT2_HOOK_SYMLINK
endif

$(eval $(call ROOTFS_TARGET,ext2))
