import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700',
        className
      )}
      {...props}
    />
  );
}
