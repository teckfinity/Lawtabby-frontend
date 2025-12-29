import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, MessageSquare, User } from "lucide-react";
import { ContactUs } from "@/api/contact_us";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // ← Yeh naya code add kiya – page load hone par top par scroll kar dega
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      // Call actual backend API
      const response = await ContactUs(data);
      //  Handle successful response
      toast({
        title: "Message Sent",
        description:
          response.data?.message ||
          "We've received your message and will get back to you soon.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      // Handle API error response
      toast({
        title: "Submission Failed",
        description:
          error?.response?.data?.message ||
          "Something went wrong while sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
{/* -------- Fixed Logo at Top-Left -------- */}
      <div className="fixed top-0 left-0 z-50 px-6 md:px-8 lg:px-12 pt-8 pb-8 bg-background">
        <img
          src="/logo.svg"
          alt="LexOrbit Logo"
          className="h-20 md:h-24 lg:h-28 object-contain"
        />
      </div>

      {/* -------- Centered Form Section -------- */}
<div className="flex-1 flex items-start justify-center px-6 md:px-8 lg:px-12 pt-32 pb-12">        <div className="w-full max-w-[600px]">
          {/* -------- Contact Card -------- */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>

              <div>
                <CardTitle className="text-2xl">Contact Support</CardTitle>
                <CardDescription className="text-base">
                  Have a question or need help? Send us a message and we'll get back
                  to you as soon as possible.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter your name" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What is this about?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us more about your inquiry..."
                          className="min-h-[150px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              We typically respond within 24–48 hours
            </div>
          </CardContent>
        </Card>

          {/* -------- Back to Dashboard -------- */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* -------- Footer -------- */}
          <div className="mt-10 text-center text-xs text-muted-foreground">
            This project is developed by{" "}
            <a
              href="https://getlexorbit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              LexOrbit.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
