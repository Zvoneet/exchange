-- CreateTable
CREATE TABLE `Agent` (
  `id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `lastSeenAt` DATETIME(3) NULL,
  `agentType` ENUM('personal', 'entity') NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `publicUrl` VARCHAR(191) NULL,
  `handle` VARCHAR(191) NULL,
  `status` ENUM('active', 'revoked', 'pending') NOT NULL DEFAULT 'active',
  UNIQUE INDEX `Agent_handle_key`(`handle`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Capability` (
  `id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `agentId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `version` VARCHAR(191) NULL,
  `actions` JSON NULL,
  INDEX `Capability_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentMetadata` (
  `id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `tags` JSON NULL,
  `categories` JSON NULL,
  `locales` JSON NULL,
  `geoLat` DOUBLE NULL,
  `geoLng` DOUBLE NULL,
  `geoRadiusKm` DOUBLE NULL,
  `cuisines` JSON NULL,
  `serviceArea` VARCHAR(191) NULL,
  `extra` JSON NULL,
  UNIQUE INDEX `AgentMetadata_agentId_key`(`agentId`),
  INDEX `AgentMetadata_geoLat_geoLng_idx`(`geoLat`, `geoLng`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
  `id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  INDEX `RefreshToken_agentId_createdAt_idx`(`agentId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeConfig` (
  `id` INTEGER NOT NULL,
  `registrationMode` ENUM('open', 'code_required') NOT NULL DEFAULT 'open',
  `registrationCodeHash` VARCHAR(191) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Capability` ADD CONSTRAINT `Capability_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AgentMetadata` ADD CONSTRAINT `AgentMetadata_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
