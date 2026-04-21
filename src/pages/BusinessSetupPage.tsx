import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Building2, UserCircle, Mail, Plus, X } from "lucide-react";
import TopAccent from "@/components/TopAccent";

const BusinessSetupPage = () => {
  const {
    language,
    setAuthState,
    businessName,
    setBusinessName,
    ownerName,
    setOwnerName,
    saveProfile,
    accountTypes,
  } = useApp();
  const tr = t[language];
  const [invites, setInvites] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const addInvite = () => {
    if (inviteEmail.trim() && !invites.includes(inviteEmail.trim())) {
      setInvites([...invites, inviteEmail.trim()]);
      setInviteEmail("");
    }
  };

  const handleContinue = async () => {
    if (!businessName.trim() || !ownerName.trim()) return;
    setSaving(true);
    await saveProfile({
      business_name: businessName,
      owner_name: ownerName,
      invites,
      account_types: accountTypes,
      is_business: true,
    });
    setSaving(false);
    setAuthState("tutorial");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Set Up Your Business</h1>
        </div>

        <div className="bg-card border border-border p-5 space-y-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder={tr.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
          </div>
          <div className="relative">
            <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder={tr.ownerName} value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{tr.inviteEmployees}</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder={tr.inviteByEmail} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={addInvite} className="bg-primary text-primary-foreground px-3 hover:opacity-90 transition">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {invites.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invites.map((inv) => (
                  <span key={inv} className="bg-primary-light text-sm px-2 py-1 flex items-center gap-1">
                    {inv}
                    <button onClick={() => setInvites(invites.filter((i) => i !== inv))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleContinue} disabled={!businessName.trim() || !ownerName.trim() || saving}
            className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {saving ? "Saving…" : tr.continueBtn}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetupPage;
