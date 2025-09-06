import { Shield, Lock, Eye, Users } from "lucide-react";

const PrivacySection = () => {
  return (
    <section className="px-6 py-16 bg-muted/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">
          We value your privacy and do not use your personal data to train Research AI
        </h2>
        <p className="text-muted-foreground mb-12 leading-relaxed">
          Research AI does not use your personal data, including your uploads, 
          queries, and the responses from the model for training.
        </p>
        
        <div className="grid md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Secure</h3>
            <p className="text-sm text-muted-foreground">Your data is protected</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Private</h3>
            <p className="text-sm text-muted-foreground">No training on your data</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Transparent</h3>
            <p className="text-sm text-muted-foreground">Clear data usage</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Yours</h3>
            <p className="text-sm text-muted-foreground">You own your content</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;