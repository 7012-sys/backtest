import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { BacktestResults } from "@/components/backtest/BacktestResults";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, IndianRupee, Clock, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { useSubscription } from "@/hooks/useSubscription";

interface BacktestData {
  id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  created_at: string;
  results: Json;
  strategy_id: string;
}

interface Strategy {
  name: string;
}

const BacktestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState<BacktestData | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isPro } = useSubscription(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && id) {
      fetchBacktest();
    }
  }, [user, id]);

  const fetchBacktest = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("backtests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      setError("Backtest not found or you don't have access.");
      setLoading(false);
      return;
    }

    setBacktest(data);

    // Fetch strategy name
    if (data.strategy_id) {
      const { data: strategyData } = await supabase
        .from("strategies")
        .select("name")
        .eq("id", data.strategy_id)
        .single();

      if (strategyData) {
        setStrategy(strategyData);
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/auth");
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("backtests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast.error("Failed to delete backtest");
      setIsDeleting(false);
      return;
    }

    toast.success("Backtest deleted successfully");
    navigate("/dashboard");
  };

  if (error) {
    return (
      <AppLayout loading={false} showBack backTo="/dashboard" title="Backtest Details" onSignOut={handleSignOut}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Parse results from JSON
  const results = backtest?.results as any;

  return (
    <AppLayout 
      loading={loading} 
      showBack 
      backTo="/dashboard"
      title="Backtest Details"
      subtitle={strategy?.name || "Loading..."}
      onSignOut={handleSignOut}
    >
      {backtest && results && (
        <>
          {/* Meta Info */}
          <Card className="mb-6 border-border">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">
                      {new Date(backtest.start_date).toLocaleDateString()} - {new Date(backtest.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Capital:</span>
                    <span className="font-medium">₹{backtest.initial_capital.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="font-medium">{backtest.timeframe}</span>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Backtest</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this backtest? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <BacktestResults results={results} symbol={backtest.symbol} isPro={isPro} />
        </>
      )}
    </AppLayout>
  );
};

export default BacktestDetail;
