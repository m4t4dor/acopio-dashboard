<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class NotificarSupabaseCambiosJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $key,
        public Carbon $updateAt,
        public string|null $payload
    ) {
        $this->key = $key;
        $this->updateAt = $updateAt;
        $this->payload = $payload;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        DB::connection('supabase')->table('listeners')->updateOrInsert([
            'key' => $this->key,
        ], [
            'updated_at' => $this->updateAt,
            'payload' => $this->payload,
        ]);
    }
}
