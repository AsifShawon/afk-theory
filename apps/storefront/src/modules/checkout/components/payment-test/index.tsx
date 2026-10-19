const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-heading font-semibold uppercase tracking-wider bg-brand-accent text-brand-primary rounded-xs ${className}`}>
      Cash on Delivery
    </span>
  )
}

export default PaymentTest
