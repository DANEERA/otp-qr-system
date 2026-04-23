-- DropIndex
DROP INDEX "public"."User_mobileNumber_key";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "mobileNumber" DROP NOT NULL;
