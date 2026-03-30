'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, ChevronRight, Upload, ExternalLink, AlertCircle } from "lucide-react";

interface Contract {
  id: string;
  offer_letter_id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  reporting_station: string | null;
  expected_start_date: string;
  status: string;
  token_expires_at: string;
}

type Step = 'contract-review' | 'bank-details' | 'visa-status' | 'security-confirmations' | 'sign-contract' | 'bsafe-upload' | 'completed';

const stepTitles: Record<Step, string> = {
  'contract-review': 'Review Contract',
  'bank-details': 'Bank Details',
  'visa-status': 'Visa Status',
  'security-confirmations': 'Security Clearances',
  'sign-contract': 'Sign Contract',
  'bsafe-upload': 'Upload BSAFE Certification',
  'completed': 'Onboarding Complete',
};

const stepOrder: Step[] = [
  'contract-review',
  'bank-details',
  'visa-status',
  'security-confirmations',
  'sign-contract',
  'bsafe-upload',
  'completed',
];

export default function ContractSignaturePage() {
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<Step>('contract-review');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Form states
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');

  const [visaStatus, setVisaStatus] = useState('');
  const [visaExpiry, setVisaExpiry] = useState('');
  const [needsVisaAssistance, setNeedsVisaAssistance] = useState(false);

  const [ifaqConfirmed, setIfaqConfirmed] = useState(false);
  const [ssafeConfirmed, setSsafeConfirmed] = useState(false);
  const [ssafeApprovalNumber, setSsafeApprovalNumber] = useState('');

  const [signerName, setSignerName] = useState('');
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignatureData, setSavedSignatureData] = useState('');

  const [bsafeFile, setBsafeFile] = useState<File | null>(null);
  const [bsafeUploading, setBsafeUploading] = useState(false);

  // Load contract
  useEffect(() => {
    async function fetchContract() {
      try {
        const supabase = createClient();
        
        const { data, error: queryError } = await supabase
          .from('employment_contracts')
          .select('*')
          .eq('contract_token', params.token as string)
          .single();

        if (queryError || !data) {
          console.log('[v0] Query error:', queryError?.message);
          setError('Invalid or expired contract link');
          setLoading(false);
          return;
        }

        // Check if token is expired
        if (new Date(data.token_expires_at) < new Date()) {
          await supabase
            .from('employment_contracts')
            .update({ status: 'expired' })
            .eq('id', data.id);
          setError('This contract has expired. Please contact HR to request a new contract.');
          setLoading(false);
          return;
        }

        setContract(data);
        setSignerName(data.applicant_name);

        // Mark as viewed
        await supabase
          .from('employment_contracts')
          .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
          .eq('id', data.id);

        // Load existing contract details if any
        const { data: details } = await supabase
          .from('contract_details')
          .select('*')
          .eq('contract_id', data.id)
          .single();

        if (details) {
          setBankAccountHolder(details.account_holder_name || '');
          setBankName(details.bank_name || '');
          setBankAccountNumber(details.account_number || '');
          setSwiftCode(details.swift_code || '');
          setIban(details.iban || '');
          setVisaStatus(details.visa_status || '');
          setVisaExpiry(details.visa_expiry || '');
          setNeedsVisaAssistance(details.needs_visa_assistance || false);
          setIfaqConfirmed(details.ifaq_confirmed || false);
          setSsafeConfirmed(details.ssafe_confirmed || false);
          setSsafeApprovalNumber(details.ssafe_approval_number || '');
        }

        // Check if already signed
        const { data: sig } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', data.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sig) {
          setSigned(true);
          setSavedSignatureData(sig.signature_data);
        }

        setLoading(false);
      } catch (err) {
        console.error('[v0] Error:', err);
        setError('Error loading contract');
        setLoading(false);
      }
    }

    if (params.token) {
      fetchContract();
    }
  }, [params.token]);

  const canGoToStep = (step: Step): boolean => {
    const stepIdx = stepOrder.indexOf(step);
    const currentIdx = stepOrder.indexOf(currentStep);
    
    // Can go back to any previous step
    if (stepIdx < currentIdx) return true;
    
    // Can go to next step if current step is completed
    if (stepIdx === currentIdx + 1) return completedSteps.has(currentStep);
    
    return false;
  };

  const handleCompleteBankDetails = async () => {
    if (!bankAccountHolder || !bankName || !bankAccountNumber) {
      alert('Please fill in all bank details');
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('employment_contracts')
        .update({
          account_holder_name: bankAccountHolder,
          bank_name: bankName,
          account_number: bankAccountNumber,
          swift_code: swiftCode || null,
          iban: iban || null,
        })
        .eq('id', contract!.id);

      if (error) {
        console.error('[v0] Error:', error);
        alert('Error saving bank details');
        return;
      }

      const newCompleted = new Set(completedSteps);
      newCompleted.add('bank-details');
      setCompletedSteps(newCompleted);
      setCurrentStep('visa-status');
    } catch (err) {
      console.error('[v0] Error:', err);
      alert('Error saving details');
    }
  };

  const handleCompleteVisaStatus = async () => {
    if (!visaStatus) {
      alert('Please select visa status');
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('employment_contracts')
        .update({
          visa_status: visaStatus,
          visa_notes: visaExpiry || null,
          needs_assistance: needsVisaAssistance,
        })
        .eq('id', contract!.id);

      if (error) throw error;

      const newCompleted = new Set(completedSteps);
      newCompleted.add('visa-status');
      setCompletedSteps(newCompleted);
      setCurrentStep('security-confirmations');
    } catch (err) {
      console.error('[v0] Error:', err);
      alert('Error saving visa status');
    }
  };

  const handleCompleteSecurityConfirmations = async () => {
    if (!ifaqConfirmed || !ssafeConfirmed) {
      alert('Please confirm IFAQ and SSAFE');
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('employment_contracts')
        .update({
          ifaq_status: ifaqConfirmed ? 'submitted' : 'not-submitted',
          ifaq_confirmed_at: ifaqConfirmed ? new Date().toISOString() : null,
          ssafe_status: ssafeConfirmed ? 'submitted' : 'not-submitted',
          ssafe_confirmed_at: ssafeConfirmed ? new Date().toISOString() : null,
        })
        .eq('id', contract!.id);

      if (error) throw error;

      const newCompleted = new Set(completedSteps);
      newCompleted.add('security-confirmations');
      setCompletedSteps(newCompleted);
      setCurrentStep('sign-contract');
    } catch (err) {
      console.error('[v0] Error:', err);
      alert('Error saving confirmations');
    }
  };

  const handleSignContract = async () => {
    if (!consent) {
      alert('Please accept the consent to sign');
      return;
    }

    if (!signerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (signatureType === 'drawn' && !canvasRef.current) {
      alert('Signature canvas error');
      return;
    }

    try {
      setSigning(true);
      const supabase = createClient();

      let signatureData = signerName;
      if (signatureType === 'drawn' && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL();
      }

      const { error } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contract!.id,
          signature_type: signatureType,
          signature_data: signatureData,
          signer_name: signerName,
          signed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update contract status
      await supabase
        .from('employment_contracts')
        .update({ status: 'signed', signed_at: new Date().toISOString() })
        .eq('id', contract!.id);

      setSigned(true);
      setSavedSignatureData(signatureData);

      const newCompleted = new Set(completedSteps);
      newCompleted.add('sign-contract');
      setCompletedSteps(newCompleted);
      setCurrentStep('bsafe-upload');
    } catch (err) {
      console.error('[v0] Error:', err);
      alert('Error signing contract');
    } finally {
      setSigning(false);
    }
  };

  const handleBsafeUpload = async () => {
    if (!bsafeFile) {
      alert('Please select a BSAFE file to upload');
      return;
    }

    try {
      setBsafeUploading(true);
      const supabase = createClient();

      // Upload to blob storage
      const formData = new FormData();
      formData.append('file', bsafeFile);

      const uploadRes = await fetch(`/api/contracts/${contract!.id}/upload-bsafe`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      // Update contract status
      await supabase
        .from('employment_contracts')
        .update({ status: 'bsafe_pending' })
        .eq('id', contract!.id);

      const newCompleted = new Set(completedSteps);
      newCompleted.add('bsafe-upload');
      setCompletedSteps(newCompleted);
      setCurrentStep('completed');
    } catch (err) {
      console.error('[v0] Error:', err);
      alert('Error uploading BSAFE file');
    } finally {
      setBsafeUploading(false);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'drawn' || !canvasRef.current) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const { x, y } = getCanvasCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Employment Contract</h1>
          <p className="text-muted-foreground">Please complete all steps to finalize your employment</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepOrder.map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => canGoToStep(step) && setCurrentStep(step)}
                  disabled={!canGoToStep(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    completedSteps.has(step) ? 'bg-green-500 text-white' :
                    currentStep === step ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                    canGoToStep(step) ? 'bg-slate-200 text-slate-700 cursor-pointer hover:bg-slate-300' :
                    'bg-slate-100 text-slate-400'
                  }`}
                >
                  {completedSteps.has(step) ? <Check className="h-5 w-5" /> : idx + 1}
                </button>
                {idx < stepOrder.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    completedSteps.has(step) ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">Step {stepOrder.indexOf(currentStep) + 1} of {stepOrder.length}: {stepTitles[currentStep]}</p>
        </div>

        {/* Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{stepTitles[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contract Review */}
            {currentStep === 'contract-review' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Please review the contract details below. If you have any questions or concerns, please contact HR before proceeding.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-semibold">{contract.applicant_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-semibold">{contract.applicant_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <p className="font-semibold">{contract.job_title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reporting Station</Label>
                    <p className="font-semibold">{contract.reporting_station || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Expected Start Date</Label>
                    <p className="font-semibold">{new Date(contract.expected_start_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Button 
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full"
                  >
                    Print Contract
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      const newCompleted = new Set(completedSteps);
                      newCompleted.add('contract-review');
                      setCompletedSteps(newCompleted);
                      setCurrentStep('bank-details');
                    }}
                    className="flex-1"
                  >
                    Proceed to Bank Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {currentStep === 'bank-details' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    Please provide your bank account details for salary payment. This information is securely encrypted.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account-holder">Account Holder Name</Label>
                    <Input
                      id="account-holder"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Full name on bank account"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Bank of Uganda"
                    />
                  </div>

                  <div>
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Your account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank-code">SWIFT Code (Optional)</Label>
                    <Input
                      id="bank-code"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      placeholder="Bank SWIFT code"
                    />
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN (Optional)</Label>
                    <Input
                      id="iban"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      placeholder="International Bank Account Number"
                    />
                  </div>
                </div>

                <Button onClick={handleCompleteBankDetails} className="w-full">
                  Continue to Visa Status
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Visa Status */}
            {currentStep === 'visa-status' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-900">
                    Please provide information about your visa status and whether you require assistance.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="visa-status">Visa Status</Label>
                    <Select value={visaStatus} onValueChange={setVisaStatus}>
                      <SelectTrigger id="visa-status">
                        <SelectValue placeholder="Select visa status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="not-required">Not Required</SelectItem>
                        <SelectItem value="applying">Currently Applying</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(visaStatus === 'valid' || visaStatus === 'expired' || visaStatus === 'applying') && (
                    <div>
                      <Label htmlFor="visa-expiry">Visa Expiry Date (if applicable)</Label>
                      <Input
                        id="visa-expiry"
                        type="date"
                        value={visaExpiry}
                        onChange={(e) => setVisaExpiry(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visa-assistance"
                      checked={needsVisaAssistance}
                      onCheckedChange={(checked) => setNeedsVisaAssistance(checked as boolean)}
                    />
                    <Label htmlFor="visa-assistance" className="text-sm">
                      I need assistance with visa sponsorship
                    </Label>
                  </div>
                </div>

                <Button onClick={handleCompleteVisaStatus} className="w-full">
                  Continue to Security Clearances
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Security Confirmations */}
            {currentStep === 'security-confirmations' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    Please confirm you have received and will abide by the required security briefings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="ifaq-confirm"
                        checked={ifaqConfirmed}
                        onCheckedChange={(checked) => setIfaqConfirmed(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="ifaq-confirm" className="font-semibold">
                          IFAQ (UNAC Induction) - Confirmed
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          I have completed and received approval for the IFAQ induction briefing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="ssafe-confirm"
                        checked={ssafeConfirmed}
                        onCheckedChange={(checked) => setSsafeConfirmed(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="ssafe-confirm" className="font-semibold">
                          SSAFE (Security Awareness) - Confirmed
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          I have completed the SSAFE security awareness training.
                        </p>
                      </div>
                    </div>
                  </div>

                  {ssafeConfirmed && (
                    <div>
                      <Label htmlFor="ssafe-approval">SSAFE Approval Number</Label>
                      <Input
                        id="ssafe-approval"
                        value={ssafeApprovalNumber}
                        onChange={(e) => setSsafeApprovalNumber(e.target.value)}
                        placeholder="SSAFE approval reference number"
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleCompleteSecurityConfirmations} className="w-full">
                  Continue to Sign Contract
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Sign Contract */}
            {currentStep === 'sign-contract' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900">
                    By signing this contract, you acknowledge that you have reviewed all terms and conditions.
                  </p>
                </div>

                {signed ? (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">Contract Signed Successfully</p>
                    <p className="text-muted-foreground">Proceed to upload your BSAFE certification</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signer-name">Your Full Name</Label>
                      <Input
                        id="signer-name"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label>Signature Type</Label>
                      <div className="flex gap-4 mt-2">
                        <Button
                          variant={signatureType === 'typed' ? 'default' : 'outline'}
                          onClick={() => setSignatureType('typed')}
                        >
                          Typed
                        </Button>
                        <Button
                          variant={signatureType === 'drawn' ? 'default' : 'outline'}
                          onClick={() => setSignatureType('drawn')}
                        >
                          Drawn
                        </Button>
                      </div>
                    </div>

                    {signatureType === 'drawn' && (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
                        <p className="text-sm text-muted-foreground mb-2">Draw your signature below</p>
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={120}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onTouchStart={handleMouseDown}
                          onTouchMove={handleMouseMove}
                          onTouchEnd={handleMouseUp}
                          className="border border-slate-300 rounded bg-white w-full cursor-crosshair"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                          className="mt-2"
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="consent"
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(checked as boolean)}
                      />
                      <Label htmlFor="consent" className="text-sm">
                        I hereby certify that I am authorized to sign this contract and accept all terms and conditions.
                      </Label>
                    </div>

                    <Button
                      onClick={handleSignContract}
                      disabled={!consent || !signerName.trim() || signing}
                      className="w-full"
                    >
                      {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Sign Contract
                    </Button>
                  </div>
                )}

                {signed && (
                  <Button onClick={() => {
                    const newCompleted = new Set(completedSteps);
                    newCompleted.add('sign-contract');
                    setCompletedSteps(newCompleted);
                    setCurrentStep('bsafe-upload');
                  }} className="w-full">
                    Continue to BSAFE Upload
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* BSAFE Upload */}
            {currentStep === 'bsafe-upload' && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-900 mb-2">
                    BSAFE certification is required for payroll processing and interview scheduling.
                  </p>
                  <p className="text-sm text-orange-900">
                    Get your BSAFE certification from:{' '}
                    <a href="https://unssc.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      UNSSC
                    </a>
                    {' '}or{' '}
                    <a href="https://iicar.org" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      IICAR
                    </a>
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setBsafeFile(e.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                  {bsafeFile && (
                    <p className="text-sm mt-2">Selected: {bsafeFile.name}</p>
                  )}
                </div>

                <Button
                  onClick={handleBsafeUpload}
                  disabled={!bsafeFile || bsafeUploading}
                  className="w-full"
                >
                  {bsafeUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Upload BSAFE
                </Button>
              </div>
            )}

            {/* Completed */}
            {currentStep === 'completed' && (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-2xl font-bold mb-2">Onboarding Complete!</p>
                <p className="text-muted-foreground mb-4">
                  Your contract and documents have been successfully submitted. We will review your BSAFE certification and contact you soon to schedule your interview.
                </p>
                <Badge className="bg-green-100 text-green-800">
                  All steps completed
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
