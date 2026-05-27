-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "emailVerificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3);

-- Contas já existentes: considerar email confirmado (evita bloquear usuários atuais)
UPDATE "users" SET "emailVerified" = true WHERE "emailVerified" = false;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
