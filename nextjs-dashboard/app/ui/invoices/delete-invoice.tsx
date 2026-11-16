"use client";

import { useActionState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteInvoice } from "@/app/lib/actions";
import { InvoiceFormState } from "@/app/lib/definitions";

const initialState: InvoiceFormState = {
	message: null,
};

export default function DeleteInvoice({ id }: { id: string }) {
	const deleteInvoiceWithId = deleteInvoice.bind(null, id);

	const [state, formAction, isPending] = useActionState(
		deleteInvoiceWithId,
		initialState
	);

	return (
		<div>
			<form action={formAction}>
				<button
					type='submit'
					disabled={isPending}
					aria-label='Delete invoice'
					className='rounded-md border p-2 hover:bg-gray-100 disabled:opacity-50'
				>
					<TrashIcon className='w-5' />
				</button>
			</form>

			{state.message && (
				<p
					role='alert'
					className='mt-2 text-xs text-red-500'
				>
					{state.message}
				</p>
			)}
		</div>
	);
}
