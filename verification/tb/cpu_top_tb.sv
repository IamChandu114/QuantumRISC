`timescale 1ns / 1ps

module cpu_top_tb;

logic clk;
logic reset;

logic [31:0] pc_debug;
logic [31:0] instruction_debug;

// Instantiate CPU
cpu_top dut (

    .clk(clk),
    .reset(reset),
    .pc_debug(pc_debug),
    .instruction_debug(instruction_debug)

);

// Clock generation
initial begin
    clk = 0;
    forever #5 clk = ~clk;
end

// Test sequence
initial begin

    $dumpfile("cpu_dump.vcd");
    $dumpvars(0, cpu_top_tb);

    reset = 1;

    #20;

    reset = 0;

    repeat(10) begin
        @(posedge clk);
        $display("PC = %h | Instruction = %h",
                 pc_debug,
                 instruction_debug);
    end

    $finish;

end

endmodule