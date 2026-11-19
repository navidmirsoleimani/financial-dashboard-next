"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { InvoiceFormState } from "./definitions";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, {
	ssl: "require",
});

const InvoiceSchema = z.object({
	customerId: z.string().min(1, {
		message: "Please select a customer.",
	}),

	amount: z
		.string()
		.trim()
		.min(1, { message: "Please enter an amount." })
		.refine((value) => Number.isFinite(Number(value)), {
			message: "Please enter a valid amount.",
		})
		.transform(Number)
		.refine((value) => value > 0, {
			message: "Amount must be greater than zero.",
		}),

	status: z.enum(["pending", "paid"], {
		message: "Please select an invoice status.",
	}),
});

function validateInvoice(formData: FormData) {
	return InvoiceSchema.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
}

export async function createInvoice(
	prevState: InvoiceFormState,
	formData: FormData
): Promise<InvoiceFormState> {
	const validatedFields = validateInvoice(formData);

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Please fix the errors and submit again!.",
		};
	}

	const { customerId, amount, status } = validatedFields.data;

	const amountInCents = Math.round(amount * 100);
	const date = new Date().toISOString().split("T")[0];

	try {
		await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
	} catch (error) {
		console.error("Create invoice error:", error);

		return {
			message: "Database Error: Failed to create invoice.",
		};
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function updateInvoice(
	id: string,
	prevState: InvoiceFormState,
	formData: FormData
): Promise<InvoiceFormState> {
	const validatedFields = validateInvoice(formData);

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Please fix the errors below.",
		};
	}

	const { customerId, amount, status } = validatedFields.data;

	const amountInCents = Math.round(amount * 100);

	try {
		const result = await sql`
      UPDATE invoices
      SET
        customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status}
      WHERE id = ${id}
      RETURNING id
    `;

		if (result.length === 0) {
			return {
				message: "Invoice not found. It may have already been deleted.",
			};
		}
	} catch (error) {
		console.error("Update invoice error:", error);

		return {
			message: "Database Error: Failed to update invoice.",
		};
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(
	id: string,
	prevState: InvoiceFormState,
	formData: FormData
): Promise<InvoiceFormState> {
	try {
		const result = await sql`
      DELETE FROM invoices
      WHERE id = ${id}
      RETURNING id
    `;

		if (result.length === 0) {
			return {
				message: "Invoice not found. It may have already been deleted.",
			};
		}
	} catch (error) {
		console.error("Delete invoice error:", error);

		return {
			message: "Database Error: Failed to delete invoice.",
		};
	}

	revalidatePath("/dashboard/invoices");

	return {};
}

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn("credentials", formData);
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "Invalid credentials.";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}
}
