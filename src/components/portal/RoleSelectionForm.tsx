export default function RoleSelectionForm({
  clientId,
  contractorId,
}: {
  clientId: string;
  contractorId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Client Portal option */}
      <form method="POST">
        <input type="hidden" name="role" value="client" />
        <input type="hidden" name="entityId" value={clientId} />
        <button
          type="submit"
          className="w-full text-left bg-cream-dark border border-stone-light/20 p-6 hover:border-terracotta/40 transition-colors cursor-pointer"
        >
          <h3 className="font-heading text-xl font-light text-charcoal mb-1">
            Client Portal
          </h3>
          <p className="text-sm text-stone font-body">
            View your projects and milestones
          </p>
        </button>
      </form>

      {/* Work Order Portal option */}
      <form method="POST">
        <input type="hidden" name="role" value="contractor" />
        <input type="hidden" name="entityId" value={contractorId} />
        <button
          type="submit"
          className="w-full text-left bg-cream-dark border border-stone-light/20 p-6 hover:border-terracotta/40 transition-colors cursor-pointer"
        >
          <h3 className="font-heading text-xl font-light text-charcoal mb-1">
            Work Order Portal
          </h3>
          <p className="text-sm text-stone font-body">
            View your assigned work orders
          </p>
        </button>
      </form>
    </div>
  );
}
