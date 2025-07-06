
export default function Footer() {
  return (
     <footer className="py-6 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AnonLink. All rights reserved. </p>
          <p className="mt-2">
            Made with ❤️ by{' '}
            <a
              href="https://instagram.com/shivamsinghamrajput"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Shiva
            </a>
          </p>
        </div>
      </footer>
  );
}
