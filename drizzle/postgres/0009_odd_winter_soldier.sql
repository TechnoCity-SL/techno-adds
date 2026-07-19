CREATE TABLE "ad_attribute_values" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"category_attribute_id" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_images" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_id" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"options" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_attribute_values" ADD CONSTRAINT "ad_attribute_values_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_attribute_values" ADD CONSTRAINT "ad_attribute_values_category_attribute_id_category_attributes_id_fk" FOREIGN KEY ("category_attribute_id") REFERENCES "public"."category_attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_images" ADD CONSTRAINT "ad_images_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;